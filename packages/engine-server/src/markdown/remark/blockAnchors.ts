import _ from "lodash";
import { DendronError } from "@dendronhq/common-all";
import { Eat } from "remark-parse";
import Unified, { Plugin } from "unified";
import { BlockAnchor, DendronASTDest } from "../types";
import { MDUtilsV4 } from "../utils";
import { Element } from "hast";
import { html } from "mdast-builder";

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

type PluginOpts = {
  hideBlockAnchors?: boolean;
};

const plugin: Plugin<[PluginOpts?]> = function (
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

function attachCompiler(proc: Unified.Processor, _opts?: PluginOpts) {
  const Compiler = proc.Compiler;
  const visitors = Compiler.prototype.visitors;

  if (visitors) {
    visitors.blockAnchor = function (node: BlockAnchor): string | Element {
      debugger;
      const { dest } = MDUtilsV4.getDendronData(proc);
      switch (dest) {
        case DendronASTDest.MD_DENDRON:
        case DendronASTDest.MD_REGULAR:
        case DendronASTDest.MD_ENHANCED_PREVIEW:
        case DendronASTDest.HTML:
          return `^${node.id}`;
        default:
          throw new DendronError({ message: "Unable to render block anchor" });
      }
    };
  }
}

export function blockAnchor2html(node: BlockAnchor, opts?: PluginOpts) {
  const fullId = `^${node.id}`;
  const style =
    opts && opts.hideBlockAnchors
      ? "visibility: hidden; width: 0; height: 0;"
      : "font-size: 0.8em; opacity: 75%;";
  return html(
    `<a id="${fullId}" href="#${fullId}" style="${style}">${fullId}</a>`
  );
}

export { plugin as blockAnchors };
export { PluginOpts as BlockAnchorOpts };
