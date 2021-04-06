import { Eat } from "remark-parse";
import Unified, { Plugin } from "unified";
import { parseDendronRef } from "../../utils";
import { DendronASTDest, NoteRefNoteV4_LEGACY } from "../types";
import { MDUtilsV4 } from "../utils";
import { LinkUtils } from "./utils";
import { WikiLinksOpts } from "./wikiLinks";

const LINK_REGEX = /^\(\((?<ref>[^)]+)\)\)/;

type PluginOpts = CompilerOpts;

type CompilerOpts = {
  prettyRefs?: boolean;
  wikiLinkOpts?: WikiLinksOpts;
};

const plugin: Plugin = function (this: Unified.Processor) {
  attachParser(this);
  if (this.Compiler != null) {
    attachCompiler(this);
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

function attachCompiler(proc: Unified.Processor) {
  const Compiler = proc.Compiler;
  const visitors = Compiler.prototype.visitors;
  const { dest } = MDUtilsV4.getDendronData(proc);

  if (visitors) {
    visitors.refLink = function (node: NoteRefNoteV4_LEGACY) {
      const ndata = node.data;
      if (dest === DendronASTDest.MD_DENDRON) {
        const { fname, alias } = ndata.link.from;
        const { anchorStart, anchorStartOffset, anchorEnd } = ndata.link.data;
        let link = alias ? `${alias}|${fname}` : fname;
        let suffix = "";
        if (anchorStart) {
          suffix += `#${anchorStart}`;
        }
        if (anchorStartOffset) {
          suffix += `,${anchorStartOffset}`;
        }
        if (anchorEnd) {
          suffix += `:#${anchorEnd}`;
        }
        return `((ref:[[${link}]]${suffix}))`;
      }
      return;
    };
  }
}

/**
 * Look at links and do initial pass
 */
export { plugin as noteRefs };
export { PluginOpts as NoteRefsOpts };
