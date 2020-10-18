import { DEngineClientV2, Note } from "@dendronhq/common-all";
import { removeMDExtension } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import { Parent } from "mdast";
import path from "path";
import { Eat } from "remark-parse";
import { Processor } from "unified";
import { Node } from "unist";
import { DendronRefLink, parseDendronRef } from "../../../utils";
import { getProcessor } from "../utils";
import { ParserUtilsV2 } from "../utilsv2";
import { dendronRefsPlugin } from "./dendronRefsPlugin";
import { findIndex, isHeading } from "./inject";
import { ReplaceRefOptions, replaceRefs } from "./replaceRefs";

const LINK_REGEX = /^\(\((?<ref>[^)]+)\)\)/;

type CompilerOpts = {
  engine: DEngineClientV2;
  renderWithOutline: boolean;
  replaceRefOpts: ReplaceRefOptions;
  refLvl?: number;
};

type RefLinkData = {
  link: DendronRefLink;
  // --- Old
  alias: string;
  permalink: string;
  exists: boolean;
  hName: string;
  hProperties: any;
  hChildren: any[];
  toMd?: boolean;
  prefix?: string;
  useId: boolean;
  note?: Note;
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

function extractNoteRef(opts: {
  body: string;
  link: DendronRefLink;
  engine: DEngineClientV2;
  renderWithOutline: boolean;
  dendronRefsOpts: ReplaceRefOptions;
  refLvl: number;
}) {
  const {
    refLvl,
    body,
    link,
    engine,
    renderWithOutline,
    dendronRefsOpts,
  } = opts;
  const root = engine.vaults[0];
  const proc = ParserUtilsV2.getRemark().use(dendronRefsPlugin, {
    root,
    renderWithOutline,
    replaceRefs: dendronRefsOpts,
    refLvl,
  });
  const bodyAST: Parent = proc.parse(body) as Parent;
  const { anchorStart, anchorEnd, anchorStartOffset } = link;
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

  // convert links
  let outProc = ParserUtilsV2.getRemark().use(replaceRefs, dendronRefsOpts);
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

function plugin(opts: CompilerOpts) {
  // @ts-ignore
  let _this: Processor = this;
  attachParser({ proc: _this });
  attachCompiler({ proc: _this, ...opts });
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
  } & CompilerOpts
) {
  const {
    refLvl,
    proc,
    engine,
    renderWithOutline,
    replaceRefOpts: dendronRefsOpts,
  } = _.defaults(opts, { refLvl: 0 });
  const Compiler = proc.Compiler;
  const visitors = Compiler.prototype.visitors;
  visitors.refLink = function (node: Node) {
    const data = node.data as RefLinkData;
    const root = engine.vaults[0];
    const body = fs.readFileSync(path.join(root, data.link.name + ".md"), {
      encoding: "utf8",
    });
    const out = extractNoteRef({
      body,
      link: data.link,
      engine,
      renderWithOutline,
      dendronRefsOpts,
      refLvl,
    });
    if (renderWithOutline) {
      let link = data.link.name;
      link = _.trim(
        getProcessor()
          .use(replaceRefs, {
            ..._.omit(dendronRefsOpts, "wikiLink2Md"),
            wikiLink2Html: true,
          })
          .processSync(`[[${link}]]`)
          .toString()
      );
      return doRenderWithOutline({
        content: out,
        title: data.link.label || data.link.name || "no title",
        link,
      });
    } else {
      return out;
    }
  };
  return Compiler;
}

export { plugin as dendronNoteRefPlugin };
export { CompilerOpts as DendronNoteRefPluginOpts };
