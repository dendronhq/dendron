import _ from "lodash";
import { DendronError, DEngine, DEngineClient, NoteUtils } from "@dendronhq/common-all";
import { Eat } from "remark-parse";
import Unified, { Plugin } from "unified";
import { DendronASTDest, DendronASTTypes, HashTag } from "../types";
import { MDUtilsV4 } from "../utils";
import { Element } from "hast";
import { html } from "mdast-builder";
import { LINK_NAME } from "./utils";

/** Hashtags have the form #foo, or #foo.bar, or #f123
 *
 * Hashtags are not allowed to start with numbers: this is to reserve them in
 * case we want to add Github issues integration, where issues look like #123
 *
 * Other then the reservation on the first character, hashtags can contain any
 * character that a note name can.
 */
export const HASHTAG_REGEX = new RegExp(`^#([^0-9]${LINK_NAME})`);
export const HASHTAG_REGEX_LOOSE = new RegExp(`^#([^0-9]${LINK_NAME})`);

/**
 *
 * @param text The text to check if it matches an block anchor.
 * @param matchLoose If true, a block anchor anywhere in the string will match. Otherwise the string must contain only the anchor.
 * @returns The identifier for the match block anchor, or undefined if it did not match.
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
        fname: `tags.${match[1]}`,
      });
    }
    return;
  }
  inlineTokenizer.locator = locator;

  const Parser = proc.Parser;
  const inlineTokenizers = Parser.prototype.inlineTokenizers;
  const inlineMethods = Parser.prototype.inlineMethods;
  inlineTokenizers.blockAnchor = inlineTokenizer;
  inlineMethods.splice(inlineMethods.indexOf("link"), 0, "hashtag");
}

function attachCompiler(proc: Unified.Processor, _opts?: PluginOpts) {
  const Compiler = proc.Compiler;
  const visitors = Compiler.prototype.visitors;

  if (visitors) {
    visitors.blockAnchor = (node: HashTag): string | Element => {
      const { dest } = MDUtilsV4.getDendronData(proc);
      switch (dest) {
        case DendronASTDest.MD_DENDRON:
        case DendronASTDest.MD_REGULAR:
          return `#${node.fname}`;
        case DendronASTDest.MD_ENHANCED_PREVIEW: {
          const procOpts = MDUtilsV4.getProcOpts(proc);
          return hashtag2htmlRaw(node, procOpts.engine);
        }
        default:
          throw new DendronError({ message: "Unable to render block anchor" });
      }
    };
  }
}

export function hashtag2htmlRaw(node: HashTag, engine: DEngineClient, _opts?: PluginOpts) {
  // TODO: What if we can't find the note?
  const note = NoteUtils.getNotesByFname({fname: node.fname, notes: engine.notes})[0];
  
  return (
    // TODO: This is not correct. Figure out how to generate the correct link.
    `<a aria-hidden="true" class="block-anchor anchor-heading" href="/notes/${note.id}.html">` +
    node.fname +
    "</a>"
  );
}

export function hashtag2html(node: HashTag, engine: DEngine, opts?: PluginOpts) {
  return html(hashtag2htmlRaw(node, engine, opts));
}

export { plugin as blockAnchors };
export { PluginOpts as BlockAnchorOpts };
