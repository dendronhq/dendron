import {
  ConfigUtils,
  DendronError,
  TAGS_HIERARCHY,
} from "@dendronhq/common-all";
import { Element } from "hast";
import { Eat } from "remark-parse";
import Unified, { Plugin } from "unified";
import { SiteUtils } from "../SiteUtils";
import { DendronASTDest, DendronASTTypes, HashTag } from "../types";
import { MDUtilsV5 } from "../utilsv5";

/** All sorts of punctuation marks and quotation marks from different languages. Please add any that may be missing.
 *
 * Be warned that this excludes period (.) as it has a special meaning in Dendron. Make sure to handle it appropriately depending on the context.
 *
 * Mind that this may have non regex-safe characters, run it through `_.escapeRegExp` if needed.
 */
export const PUNCTUATION_MARKS =
  ",;:'\"<>()?!`~«‹»›„“‟”’❝❞❮❯⹂〝〞〟＂‚‘‛❛❜❟［］【】…‥「」『』·؟،।॥‽⸘¡¿⁈⁉";

/** Can't start with a number or period */
const GOOD_FIRST_CHARACTER = `[^0-9#@|\\[\\]\\s.${PUNCTUATION_MARKS}]`;
/** Can have numbers and period in the middle */
const GOOD_MIDDLE_CHARACTER = `[^@#|\\[\\]\\s${PUNCTUATION_MARKS}]`;
/** Can have numbers and period at the end */
const GOOD_END_CHARACTER = `[^@#|\\[\\]\\s${PUNCTUATION_MARKS}]`;

/** Hashtags have the form #foo, or #foo.bar, or #f123
 *
 * Hashtags are not allowed to start with numbers: this is to reserve them in
 * case we want to add Github issues integration, where issues look like #123
 *
 * Hashtags are also not allowed to contain any punctuation or quotation marks.
 * This allows them to be more easily mixed into text, for example:
 *
 * ```
 * This issue is #important, and should be prioritized.
 * ```
 *
 * Here, the tag is `#important` without the following comma.
 */
export const HASHTAG_REGEX = new RegExp(
  // Avoid matching it if there's a non-whitespace character before (like ab#cd)
  `^(?<!\\S)(?<hashTag>#)(?<tagContents>` +
    // 2 or more characters, like #a1x or #a.x. This MUST come before 1 character case, or regex will match 1 character and stop.
    `${GOOD_FIRST_CHARACTER}${GOOD_MIDDLE_CHARACTER}*${GOOD_END_CHARACTER}` +
    // or
    "|" +
    // Just 1 character, like #a
    `${GOOD_FIRST_CHARACTER}` +
    ")"
);
/** Same as `HASHTAG_REGEX`, except that that it doesn't have to be at the start of the string. */
export const HASHTAG_REGEX_LOOSE = new RegExp(
  // Avoid matching it if there's a non-whitespace character before (like ab#cd)
  `(?<!\\S)(?<hashTag>#)(?<tagContents>` +
    // 2 or more characters, like #a1x or #a.x. This MUST come before 1 character case, or regex will match 1 character and stop.
    `${GOOD_FIRST_CHARACTER}${GOOD_MIDDLE_CHARACTER}*${GOOD_END_CHARACTER}` +
    // or
    "|" +
    // Just 1 character, like #a
    `${GOOD_FIRST_CHARACTER}` +
    ")"
);
/** Used for `getWordAtRange` queries. Too permissive, but the full regex breaks the function. */
export const HASHTAG_REGEX_BASIC = new RegExp(`#${GOOD_MIDDLE_CHARACTER}+`);

export class HashTagUtils {
  static extractTagFromMatch(match: RegExpMatchArray | null) {
    if (match && match.groups) return match.groups.tagContents;
    return undefined;
  }

  /**
   *
   * @param text The text to check if it matches an hashtag.
   * @param matchLoose If true, a hashtag anywhere in the string will match. Otherwise the string must contain only the anchor.
   * @returns The identifier for the matched hashtag, or undefined if it did not match.
   */
  static matchHashtag = (
    text: string,
    matchLoose: boolean = true
  ): string | undefined => {
    const match = (matchLoose ? HASHTAG_REGEX : HASHTAG_REGEX_LOOSE).exec(text);
    return this.extractTagFromMatch(match);
  };
}

type PluginOpts = {};

const plugin: Plugin<[PluginOpts?]> = function plugin(
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
    // Do not locate a symbol if the previous character is non-whitespace.
    // Unified cals tokenizer starting at the index we return here,
    // so tokenizer won't be able to reject it for not starting with a non-space character.
    const atSymbol = value.indexOf("#", fromIndex);
    if (atSymbol === 0) {
      return atSymbol;
    } else if (atSymbol > 0) {
      const previousSymbol = value[atSymbol - 1];
      if (!previousSymbol || /\s/.exec(previousSymbol)) {
        return atSymbol;
      }
    }
    return -1;
  }

  function inlineTokenizer(eat: Eat, value: string) {
    const { enableHashTags } = ConfigUtils.getWorkspace(
      MDUtilsV5.getProcData(proc).config
    );
    if (enableHashTags === false) return;
    const match = HASHTAG_REGEX.exec(value);
    if (match && match.groups?.tagContents) {
      return eat(match[0])({
        type: DendronASTTypes.HASHTAG,
        // @ts-ignore
        value: match[0],
        fname: `${TAGS_HIERARCHY}${match.groups.tagContents}`,
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
      const { dest, config } = MDUtilsV5.getProcData(proc);
      const prefix = SiteUtils.getSitePrefixForNote(config);
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
