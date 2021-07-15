import _ from "lodash";
import { DendronError, TAGS_HIERARCHY } from "@dendronhq/common-all";
import { Eat } from "remark-parse";
import Unified, { Plugin } from "unified";
import { DendronASTDest, DendronASTTypes, HashTag } from "../types";
import { MDUtilsV4 } from "../utils";
import { Element } from "hast";

/** Hashtags have the form #foo, or #foo.bar, or #f123
 *
 * Hashtags are not allowed to start with numbers: this is to reserve them in
 * case we want to add Github issues integration, where issues look like #123
 *
 * Other then the reservation on the first character, hashtags can contain any
 * character that a note name can.
 */
export const HASHTAG_REGEX = /^#([^0-9#|>[\]\s][^#|>[\]\s]*)/;
export const HASHTAG_REGEX_LOOSE = /#([^0-9#|>[\]\s][^#|>[\]\s]*)/;

/**
 *
 * @param text The text to check if it matches an hashtag.
 * @param matchLoose If true, a hashtag anywhere in the string will match. Otherwise the string must contain only the anchor.
 * @returns The identifier for the matched hashtag, or undefined if it did not match.
 */
export const matchHashtag = (
  text: string,
  matchLoose: boolean = true
): string | undefined => {
  const match = (matchLoose ? HASHTAG_REGEX : HASHTAG_REGEX_LOOSE).exec(
    text
  );
  if (match && match.length === 1) return match[1];
  return undefined;
};

type PluginOpts = {
};

const plugin: Plugin<[PluginOpts?]> = function plugin (
  this: Unified.Processor,
  opts?: PluginOpts
) {
  attachParser(this);
  if (this.Compiler != null) {
    attachCompiler(this, opts);
  }
};

function attachParser(proc: Unified.Processor) {
  function locator(value: string, fromIndex: number) {
    return value.indexOf("#", fromIndex);
  }

  function inlineTokenizer(eat: Eat, value: string) {
    const match = HASHTAG_REGEX.exec(value);
    if (match) {
      return eat(match[0])({
        type: DendronASTTypes.HASHTAG,
        value,
        fname: `${TAGS_HIERARCHY}${match[1]}`,
      });
    }
    return;
  }
  inlineTokenizer.locator = locator;

  const Parser = proc.Parser;
  const inlineTokenizers = Parser.prototype.inlineTokenizers;
  const inlineMethods = Parser.prototype.inlineMethods;
  inlineTokenizers.hashtag = inlineTokenizer;
  inlineMethods.splice(inlineMethods.indexOf("link"), 0, "hashtag");
}

function attachCompiler(proc: Unified.Processor, _opts?: PluginOpts) {
  const Compiler = proc.Compiler;
  const visitors = Compiler.prototype.visitors;

  if (visitors) {
    visitors.hashtag = (node: HashTag): string | Element => {
      const { dest } = MDUtilsV4.getDendronData(proc);
      const prefix = MDUtilsV4.getProcOpts(proc).wikiLinksOpts?.prefix || "";
      switch (dest) {
        case DendronASTDest.MD_DENDRON:
          return node.value;
        case DendronASTDest.MD_REGULAR:
        case DendronASTDest.MD_ENHANCED_PREVIEW:
          return `[${node.value}](${prefix}${node.fname})`;
        default:
          throw new DendronError({ message: "Unable to render hashtag" });
      }
    };
  }
}

export { plugin as hashtags };
export { PluginOpts as HashTagOpts };
