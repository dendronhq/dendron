import {
  DendronError,
  DEngineClientV2,
  DNodeUtilsV2,
  DNoteLoc,
  DNoteRefLink,
  DUtils,
  NoteUtilsV2,
} from "@dendronhq/common-all";
import { removeMDExtension, vault2Path } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import { Parent } from "mdast";
import { Eat } from "remark-parse";
import { Processor } from "unified";
import { Node } from "unist";
import { ReplaceLinkOpts } from "../../../types";
import { parseDendronRef, refLink2String } from "../../../utils";
import { ParserUtilsV2, RemarkUtilsV2 } from "../utilsv2";
import { findIndex, isHeading } from "./inject";
import { ReplaceRefOptions, replaceRefs } from "./replaceRefs";
import { RefLinkData } from "./types";

const LINK_REGEX = /^\(\((?<ref>[^)]+)\)\)/;

type HTMLCompilerOpts = {
  engine: DEngineClientV2;
  renderWithOutline: boolean;
  replaceRefOpts: ReplaceRefOptions;
  refLvl?: number;
};

type MDCompilerOpts = {
  replaceLink?: ReplaceLinkOpts;
};

// --- Utils
function doRenderWithOutline(opts: {
  content: string;
  title: string;
  link: string;
}) {
  const { content, title, link } = opts;
  return `

<div class="portal-container">
<div class="portal-head">
<div class="portal-backlink" >
<div class="portal-title">From <span class="portal-text-title">${title}</span></div>
<a href="${link}" class="portal-arrow">Go to text <span class="right-arrow">→</span></a>
</div>
</div>
<div id="portal-parent-anchor" class="portal-parent" markdown="1">
<div class="portal-parent-fader-top"></div>
<div class="portal-parent-fader-bottom"></div>        
  
${content}

</div>    
</div>
`;
}

const MAX_REF_LVL = 2;

type ConvertNoteRefOpts = {
  refLvl: number;
  link: DNoteRefLink;
  proc: Processor;
  renderWithOutline: boolean;
  // --- Will be deprecated
  /**
   * HACK before we get multi-root implemented
   */
  defaultRoot: string;
  engine: DEngineClientV2;
  replaceRefOpts: ReplaceRefOptions;
};
function convertNoteRef(opts: ConvertNoteRefOpts) {
  const {
    replaceRefOpts,
    renderWithOutline,
    engine,
    refLvl,
    link,
    defaultRoot,
    proc,
  } = _.defaults(opts);
  if (refLvl >= MAX_REF_LVL) {
    return "ERROR: Too many nested note references";
  }

  let noteRefs: DNoteLoc[] = [];
  // check if link is normal
  if (link.from.fname.endsWith("*")) {
    const resp = engine.queryNotesSync({ qs: link.from.fname });
    const out = _.filter(resp.data, (ent) =>
      DUtils.minimatch(ent.fname, link.from.fname)
    );
    noteRefs = _.sortBy(
      out.map((ent) => NoteUtilsV2.toNoteLoc(ent)),
      "fname"
    );
  } else {
    noteRefs.push(link.from);
  }
  const out = noteRefs.map((ref) => {
    const vaultPath = ref.vault?.fsPath || defaultRoot;
    const name = ref.fname;
    const alias = ref.alias;

    const npath = DNodeUtilsV2.getFullPath({
      wsRoot: engine.wsRoot,
      vault: { fsPath: vaultPath },
      basename: name + ".md",
    });
    try {
      const body = fs.readFileSync(npath, { encoding: "utf8" });
      const out = extractNoteRef({
        body,
        link,
        engine,
        renderWithOutline,
        replaceRefOpts,
        refLvl: refLvl + 1,
      });
      if (renderWithOutline) {
        let linkString = name;
        linkString = _.trim(
          ParserUtilsV2.getRemark()
            .use(plugin, {
              engine,
              renderWithOutline,
              replaceRefOpts,
              refLvl,
            })
            .use(replaceRefs, { ..._.omit(replaceRefOpts, "wikiLink2Md") })
            .processSync(`[[${linkString}]]`)
            .toString()
        );
        return doRenderWithOutline({
          content: out,
          title: alias || name || "no title",
          link: linkString,
        });
      } else {
        return out;
      }
    } catch (err) {
      const errors = proc.data("errors") as DendronError[];
      const msg = `${name} not found`;
      errors.push(new DendronError({ msg }));
      return proc.stringify(
        ParserUtilsV2.genMDError({
          msg,
          title: "Note Ref Error",
        })
      );
    }
  });
  return out.join("\n");
}

function extractNoteRef(opts: {
  body: string;
  link: DNoteRefLink;
  engine: DEngineClientV2;
  renderWithOutline: boolean;
  replaceRefOpts: ReplaceRefOptions;
  refLvl: number;
}) {
  const {
    body,
    link,
    engine,
    renderWithOutline,
    replaceRefOpts,
    refLvl,
  } = opts;

  const proc = ParserUtilsV2.getRemark().use(plugin, {
    engine,
    renderWithOutline,
    replaceRefOpts,
    refLvl,
  });

  // parse it so we can slice it
  const bodyAST: Parent = proc.parse(body) as Parent;
  const { anchorStart, anchorEnd, anchorStartOffset } = link.data;
  let anchorStartIndex = bodyAST.children[0].type === "yaml" ? 1 : 0;
  let anchorEndIndex = bodyAST.children.length;
  if (anchorStart) {
    anchorStartIndex = findIndex(bodyAST.children as any[], function (
      node: Node
    ) {
      return isHeading(node, anchorStart);
    });
    if (anchorStartIndex < 0) {
      return proc.stringify(
        ParserUtilsV2.genMDError({
          msg: `start anchor ${anchorStart} not found`,
          title: "Note Ref Error",
        })
      );
    }
  }
  if (anchorEnd) {
    anchorEndIndex = findIndex(
      bodyAST.children.slice(anchorStartIndex + 1) as any[],
      function (node: Node) {
        return isHeading(node, anchorEnd);
      }
    );
    if (anchorEndIndex < 0) {
      const mdError = ParserUtilsV2.genMDError({
        msg: `end anchor ${anchorEnd} not found`,
        title: "Note Ref Error",
      });
      return proc.stringify(mdError);
    }
    anchorEndIndex += anchorStartIndex + 1;
  }
  bodyAST.children = bodyAST.children.slice(anchorStartIndex, anchorEndIndex);

  // take the output and convert it using the full md toolchain
  let outProc = ParserUtilsV2.getRemark()
    .use(plugin, opts)
    .use(replaceRefs, replaceRefOpts);
  try {
    let out = outProc.processSync(outProc.stringify(bodyAST)).toString();
    if (anchorStartOffset) {
      out = out.split("\n").slice(anchorStartOffset).join("\n");
    }
    return out;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

// --- Main

function plugin(opts: HTMLCompilerOpts) {
  // @ts-ignore
  let _this: Processor = this;
  attachParser({ proc: _this });
  attachCompiler({ proc: _this, ...opts });
}

function pluginForMarkdown(opts?: MDCompilerOpts) {
  // @ts-ignore
  let _this: Processor = this;
  attachParser({ proc: _this });
  attachCompilerForMarkdown({ proc: _this, opts });
}

function attachCompilerForMarkdown({
  proc,
  opts,
}: {
  proc: Processor;
  opts?: MDCompilerOpts;
}) {
  const Compiler = proc.Compiler;
  const visitors = Compiler.prototype.visitors;
  visitors.refLink = function (node: Node) {
    const data = node.data as RefLinkData;
    if (opts?.replaceLink) {
      data.link = RemarkUtilsV2.replaceLink({
        link: data.link,
        opts: opts.replaceLink,
      });
    }
    return refLink2String(data.link, {
      includeParen: true,
      includeRefTag: true,
    });
  };
  return Compiler;
}

function attachParser(opts: { proc: Processor }) {
  const { proc } = opts;
  const permalinks: any[] = [];
  const aliasDivider = "|";

  function isAlias(pageTitle: string) {
    return pageTitle.indexOf(aliasDivider) !== -1;
  }
  const pageResolver = (name: string) => [name.replace(/ /g, "").toLowerCase()];

  function locator(value: string, fromIndex: number) {
    return value.indexOf("((", fromIndex);
  }

  function parsePageTitle(pageTitle: string) {
    if (isAlias(pageTitle)) {
      return parseAliasLink(pageTitle);
    }
    return {
      name: pageTitle,
      displayName: pageTitle,
    };
  }
  function parseAliasLink(pageTitle: string) {
    const [displayName, name] = pageTitle.split(aliasDivider);
    return { name, displayName };
  }

  function inlineTokenizer(eat: Eat, value: string) {
    const match = LINK_REGEX.exec(value);

    if (match) {
      const pageName = match[1].trim();
      const { link } = parseDendronRef(pageName);
      const { name, displayName } = parsePageTitle(pageName);

      const pagePermalinks = pageResolver(name);
      let permalink = pagePermalinks.find((p) => permalinks.indexOf(p) !== -1);
      const exists = permalink !== undefined;

      if (!exists) {
        permalink = pagePermalinks[0];
      }

      let classNames = "internal";
      if (!exists) {
        classNames += " " + "new";
      }
      // normalize
      if (permalink) {
        permalink = removeMDExtension(permalink);
      }

      return eat(match[0])({
        type: "refLink",
        value: name,
        data: {
          alias: displayName,
          link,
          permalink,
          exists,
          hName: "a",
          hProperties: {
            className: classNames,
            href: permalink,
          },
          hChildren: [
            {
              type: "text",
              value: displayName,
            },
          ],
        },
      });
    }
    return;
  }

  inlineTokenizer.locator = locator;

  const Parser = proc.Parser;
  const inlineTokenizers = Parser.prototype.inlineTokenizers;
  const inlineMethods = Parser.prototype.inlineMethods;
  inlineTokenizers.refLink = inlineTokenizer;
  inlineMethods.splice(inlineMethods.indexOf("link"), 0, "refLink");
  return Parser;
}

function attachCompiler(
  opts: {
    proc: Processor;
  } & HTMLCompilerOpts
) {
  const {
    refLvl,
    proc,
    engine,
    renderWithOutline,
    replaceRefOpts,
  } = _.defaults(opts, { refLvl: 0 });

  const Compiler = proc.Compiler;
  const visitors = Compiler.prototype.visitors;
  visitors.refLink = function (node: Node) {
    const data = node.data as RefLinkData;
    const wsRoot = engine.wsRoot;
    const vault = engine.vaultsv3[0];
    const vpath = vault2Path({ wsRoot, vault });
    return convertNoteRef({
      refLvl,
      proc,
      engine,
      renderWithOutline,
      replaceRefOpts,
      link: data.link,
      defaultRoot: vpath,
    });
  };
  return Compiler;
}

export { plugin as dendronNoteRefPlugin };
export { pluginForMarkdown as dendronNoteRefPluginForMd };
