import {
  DendronError,
  DNodeUtilsV2,
  DNoteLoc,
  DNoteRefLink,
  RespV2,
} from "@dendronhq/common-all";
import _ from "lodash";
import { Eat } from "remark-parse";
import Unified, { Plugin } from "unified";
import { getEngine, parseDendronRef } from "../../utils";
import { DendronASTDest, DendronASTNode, NoteRefNoteV4 } from "../types";
import { MDUtilsV4 } from "../utils";
import { LinkUtils } from "./utils";
import fs from "fs-extra";
import { Node } from "unist";
import { vault2Path } from "@dendronhq/common-server";

const LINK_REGEX = /^\(\((?<ref>[^)]+)\)\)/;

type PluginOpts = CompilerOpts;
type CompilerOpts = {
  dest: DendronASTDest;
  refLvl?: number;
  prettyRefs?: boolean;
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
      });
      return data;
      // switch (copts.dest) {
      //   case DendronASTDest.MD_REGULAR: {
      //     const alias = data.alias ? data.alias : value;
      //     return `[${alias}](${copts.prefix || ""}${value})`;
      //   }
      //   case DendronASTDest.HTML: {
      //     const alias = data.alias ? data.alias : value;
      //     return `[${alias}](${copts.prefix || ""}${value}.html)`;
      //   }
      //   default:
      //     return `unhandled case: ${copts.dest}`;
      // }
    };
  }
}

const MAX_REF_LVL = 3;

type ConvertNoteRefOpts = {
  link: DNoteRefLink;
  proc: Unified.Processor;
};

type ConvertNoteRefHelperOpts = {
  proc: Unified.Processor;
  body: string;
  link: DNoteRefLink;
  refLvl: number;
};

/**
 * Look at links and do initial pass
 */
function convertNoteRef(
  opts: ConvertNoteRefOpts
): { error: DendronError | undefined; data: string | undefined } {
  let data: string | undefined;
  let errors: DendronError[] = [];
  const { link, proc } = opts;
  const refLvl = MDUtilsV4.getNoteRefLvl(proc());

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
      });
      if (error) {
        errors.push(error);
      }
      return data;
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

export { plugin as noteRefs };
export { PluginOpts as NoteRefsOpts };
