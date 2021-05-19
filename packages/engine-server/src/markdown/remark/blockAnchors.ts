import _ from "lodash";
import { Eat } from "remark-parse";
import Unified, { Plugin } from "unified";
import { BlockAnchor, DendronASTDest } from "../types";
import { MDUtilsV4 } from "../utils";

// Letters, digits, dashes, and underscores.
// The underscores are an extension over Obsidian.
export const BLOCK_LINK_REGEX = /^\^([\w-]+)$/;
export const BLOCK_LINK_REGEX_LOOSE = /\^([\w-]+)/;

/**
 *
 * @param text The text to check if it matches an block anchor.
 * @param matchLoose If true, a block anchor anywhere in the string will match. Otherwise the string must contain only the anchor.
 * @returns The identifier for the match block anchor, or undefined if it did not match.
 */
export const matchBlockAnchor = (
  text: string,
  matchLoose: boolean = true
): string | undefined => {
  const match = (matchLoose ? BLOCK_LINK_REGEX_LOOSE : BLOCK_LINK_REGEX).exec(
    text
  );
  if (match && match.length == 1) return match[1];
  return undefined;
};

type PluginOpts = {};

type CompilerOpts = {};

const plugin: Plugin<[CompilerOpts?]> = function (
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
    return value.indexOf("^", fromIndex);
  }

  function inlineTokenizer(eat: Eat, value: string) {
    const match = BLOCK_LINK_REGEX.exec(value);
    if (match) {
      return eat(match[0])({
        type: "blockAnchor",
        value,
        id: match[1],
      });
    }
    return;
  }
  inlineTokenizer.locator = locator;

  const Parser = proc.Parser;
  const inlineTokenizers = Parser.prototype.inlineTokenizers;
  const inlineMethods = Parser.prototype.inlineMethods;
  inlineTokenizers.blockAnchor = inlineTokenizer;
  inlineMethods.splice(inlineMethods.indexOf("link"), 0, "blockAnchor");
}

function attachCompiler(proc: Unified.Processor, _opts?: CompilerOpts) {
  const Compiler = proc.Compiler;
  const visitors = Compiler.prototype.visitors;

  if (visitors) {
    visitors.blockAnchor = function (node: BlockAnchor) {
      const { dest } = MDUtilsV4.getDendronData(proc);
      switch (dest) {
        case DendronASTDest.MD_DENDRON:
        case DendronASTDest.MD_REGULAR:
        case DendronASTDest.MD_ENHANCED_PREVIEW:
        case DendronASTDest.HTML: {
          // Anything more to do here? Can we embed HTML into the preview?
          // Prints ^{\^block-id} so that it gets rendered small.
          return `^\{\\^${node.id}\}`;
        }
        default:
          return `unhandled case: ${dest}`;
      }
    };
  }
}

export { plugin as blockAnchors };
export { PluginOpts as BlockAnchorOpts };
