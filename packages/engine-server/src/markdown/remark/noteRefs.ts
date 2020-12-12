import {
  DendronError,
  DNodeUtilsV2,
  DNoteLoc,
  DNoteRefLink,
  RespV2,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import { Eat } from "remark-parse";
import Unified, { Plugin } from "unified";
import { Node } from "unist";
import { parseDendronRef } from "../../utils";
import { DendronASTDest, DendronASTNode, NoteRefNoteV4 } from "../types";
import { MDUtilsV4 } from "../utils";
import { LinkUtils } from "./utils";

const LINK_REGEX = /^\(\((?<ref>[^)]+)\)\)/;

type PluginOpts = CompilerOpts;

type CompilerOpts = {
  dest: DendronASTDest;
  prettyRefs?: boolean;
};

type ConvertNoteRefOpts = {
  link: DNoteRefLink;
  proc: Unified.Processor;
  compilerOpts: CompilerOpts;
};

type ConvertNoteRefHelperOpts = ConvertNoteRefOpts & {
  refLvl: number;
  body: string;
};

const plugin: Plugin<[PluginOpts]> = function (
  this: Unified.Processor,
  opts: PluginOpts
) {
  attachParser(this);
  if (this.Compiler != null) {
    attachCompiler(this, opts);
  }
};

function attachParser(proc: Unified.Processor) {
  function locator(value: string, fromIndex: number) {
    return value.indexOf("((", fromIndex);
  }

  function inlineTokenizer(eat: Eat, value: string) {
    const match = LINK_REGEX.exec(value);
    if (match) {
      const linkMatch = match[1].trim();
      const { link } = parseDendronRef(linkMatch);
      //const { name, displayName } = LinkUtils.parseLink(linkMatch);
      const { value, alias } = LinkUtils.parseLink(linkMatch);

      return eat(match[0])({
        type: "refLink",
        value,
        data: {
          alias,
          link,
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

function attachCompiler(proc: Unified.Processor, opts: CompilerOpts) {
  const Compiler = proc.Compiler;
  const visitors = Compiler.prototype.visitors;
  const copts = _.defaults(opts || {}, {});

  if (visitors) {
    visitors.refLink = function (node: NoteRefNoteV4) {
      const ndata = node.data;
      const { error, data } = convertNoteRef({
        link: ndata.link,
        proc,
        compilerOpts: copts,
      });
      return data;
    };
  }
}

const MAX_REF_LVL = 3;

/**
 * Look at links and do initial pass
 */
function convertNoteRef(
  opts: ConvertNoteRefOpts
): { error: DendronError | undefined; data: string | undefined } {
  let data: string | undefined;
  let errors: DendronError[] = [];
  const { link, proc, compilerOpts } = opts;
  const refLvl = MDUtilsV4.getNoteRefLvl(proc());
  let { prettyRefs } = compilerOpts;
  if (!prettyRefs && compilerOpts.dest === DendronASTDest.HTML) {
    prettyRefs = true;
  }

  if (refLvl >= MAX_REF_LVL) {
    return {
      error: new DendronError({ msg: "too many nested note refs" }),
      data,
    };
  }

  let noteRefs: DNoteLoc[] = [];
  if (link.from.fname.endsWith("*")) {
    throw new Error("not implemented, wildcard link refs");
  } else {
    noteRefs.push(link.from);
  }

  const { error, engine } = MDUtilsV4.getEngineFromProc(proc);
  const { wsRoot, vaultsv3 } = engine;
  const firstVaultPath = vault2Path({ wsRoot, vault: vaultsv3[0] });

  const out = noteRefs.map((ref) => {
    const vaultPath = ref.vault?.fsPath || firstVaultPath;
    const name = ref.fname;
    const alias = ref.alias;
    const npath = DNodeUtilsV2.getFullPath({
      wsRoot: engine.wsRoot,
      vault: { fsPath: vaultPath },
      basename: name + ".md",
    });
    try {
      const body = fs.readFileSync(npath, { encoding: "utf8" });
      const { error, data } = convertNoteRefHelper({
        body,
        link,
        refLvl: refLvl + 1,
        proc,
        compilerOpts,
      });
      if (error) {
        errors.push(error);
      }
      if (prettyRefs) {
        return renderPretty({
          content: data,
          title: alias || name || "no title",
          link: "TODO",
        });
      } else {
        return data;
      }
    } catch (err) {
      errors.push(new DendronError({ msg: `error reading file, ${npath}` }));
    }
  });
  return { error, data: out.join("\n") };
}

function convertNoteRefHelper(
  opts: ConvertNoteRefHelperOpts
): Required<RespV2<string>> {
  const { body, proc, refLvl, link } = opts;
  const noteRefProc = proc();
  MDUtilsV4.setNoteRefLvl(noteRefProc, refLvl);
  const bodyAST = noteRefProc.parse(body) as DendronASTNode;
  const { anchorStart, anchorEnd, anchorStartOffset } = link.data;

  // TODO: can i just strip frontmatter when reading?
  let anchorStartIndex = bodyAST.children[0].type === "yaml" ? 1 : 0;
  let anchorEndIndex = bodyAST.children.length;

  if (anchorStart) {
    anchorStartIndex = findHeader(bodyAST.children, anchorStart);
    if (anchorStartIndex < 0) {
      return { data: "Start anchor ${anchorStart} not found", error: null };
    }
  }

  if (anchorEnd) {
    anchorEndIndex = findHeader(
      bodyAST.children.slice(anchorStartIndex + 1),
      anchorEnd
    );
    if (anchorEndIndex < 0) {
      return { data: "end anchor ${anchorEnd} not found", error: null };
    }
    anchorEndIndex += anchorStartIndex + 1;
  }
  // interested range
  try {
    bodyAST.children = bodyAST.children.slice(anchorStartIndex, anchorEndIndex);
    let out = noteRefProc
      .processSync(noteRefProc.stringify(bodyAST))
      .toString();
    if (anchorStartOffset) {
      out = out.split("\n").slice(anchorStartOffset).join("\n");
    }
    return { error: null, data: out };
  } catch (err) {
    debugger;
    return {
      error: new DendronError({
        msg: "error processing note ref",
        payload: err,
      }),
      data: "error processing ref",
    };
  }
}

function findHeader(nodes: DendronASTNode["children"], match: string) {
  const foundIndex = MDUtilsV4.findIndex(nodes, function (node: Node) {
    return MDUtilsV4.isHeading(node, match);
  });
  return foundIndex;
}

function renderPretty(opts: { content: string; title: string; link: string }) {
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

export { plugin as noteRefs };
export { PluginOpts as NoteRefsOpts };
