import {
  ConfigUtils,
  DendronError,
  USERS_HIERARCHY,
} from "@dendronhq/common-all";
import { Element } from "hast";
import { Eat } from "remark-parse";
import Unified, { Plugin } from "unified";
import { SiteUtils } from "../SiteUtils";
import { DendronASTDest, DendronASTTypes, HashTag } from "../types";
import { MDUtilsV5 } from "../utilsv5";
import { PUNCTUATION_MARKS } from "./hashtag";

/** Can have period in the middle */
const GOOD_MIDDLE_CHARACTER = `[^#@|\\[\\]\\s${PUNCTUATION_MARKS}]`;
/** Can have period in the end */
const GOOD_END_CHARACTER = `[^#@|\\[\\]\\s${PUNCTUATION_MARKS}]`;

/** User tags have the form @Lovelace, or @Hamilton.Margaret, or @7of9.
 *
 * User tags are also not allowed to contain any punctuation or quotation marks, and will not include a trailing dot
 * This allows them to be more easily mixed into text, for example:
 *
 * ```
 * Please contact @Ben.Barres.
 * ```
 *
 * Here, the tag is `#important` without the following comma.
 */
export const USERTAG_REGEX = new RegExp(
  // Avoid matching it if there's a non-whitespace character before (like foo@example.com)
  `^(?<!\\S)(?<tagSymbol>@)(?<tagContents>` +
    `${GOOD_MIDDLE_CHARACTER}*` +
    `${GOOD_END_CHARACTER}` +
    `)`
);
/** Same as `USERTAG_REGEX`, except that that it doesn't have to be at the start of the string. */
export const USERTAG_REGEX_LOOSE = new RegExp(
  // Avoid matching it if there's a non-whitespace character before (like foo@example.com)
  `(?<!\\S)(?<userTag>@)(?<userTagContents>` +
    `${GOOD_MIDDLE_CHARACTER}*` +
    `${GOOD_END_CHARACTER}` +
    `)`
);

export class UserTagUtils {
  static extractTagFromMatch(match: RegExpMatchArray | null) {
    if (match && match.groups) {
      return match.groups.tagContents || match.groups.userTagContents;
    }
    return;
  }

  /**
   *
   * @param text The text to check if it matches an hashtag.
   * @param matchLoose If true, a hashtag anywhere in the string will match. Otherwise the string must contain only the anchor.
   * @returns The identifier for the matched hashtag, or undefined if it did not match.
   */
  static matchUserTag = (
    text: string,
    matchLoose: boolean = true
  ): string | undefined => {
    const match = (matchLoose ? USERTAG_REGEX : USERTAG_REGEX_LOOSE).exec(text);
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
    const atSymbol = value.indexOf("@", fromIndex);
    if (atSymbol === 0) {
      return atSymbol;
    } else if (atSymbol > 0) {
      const previousSymbol = value[atSymbol - 1];
      if (!previousSymbol || /[\s]/.exec(previousSymbol)) {
        return atSymbol;
      }
    }
    return -1;
  }

  function inlineTokenizer(eat: Eat, value: string) {
    const { enableUserTags } = ConfigUtils.getWorkspace(
      MDUtilsV5.getProcData(proc).config
    );
    if (enableUserTags === false) return;
    const match = USERTAG_REGEX.exec(value);
    if (match && match.groups?.tagContents) {
      return eat(match[0])({
        type: DendronASTTypes.USERTAG,
        // @ts-ignore
        value: match[0],
        fname: `${USERS_HIERARCHY}${match.groups.tagContents}`,
      });
    }
    return;
  }
  inlineTokenizer.locator = locator;

  const Parser = proc.Parser;
  const inlineTokenizers = Parser.prototype.inlineTokenizers;
  const inlineMethods = Parser.prototype.inlineMethods;
  inlineTokenizers.users = inlineTokenizer;
  inlineMethods.splice(inlineMethods.indexOf("link"), 0, "users");
}

function attachCompiler(proc: Unified.Processor, _opts?: PluginOpts) {
  const Compiler = proc.Compiler;
  const visitors = Compiler.prototype.visitors;

  if (visitors) {
    visitors.usertag = (node: HashTag): string | Element => {
      const { dest, config } = MDUtilsV5.getProcData(proc);
      const prefix = SiteUtils.getSitePrefixForNote(config);
      switch (dest) {
        case DendronASTDest.MD_DENDRON:
          return node.value;
        case DendronASTDest.MD_REGULAR:
        case DendronASTDest.MD_ENHANCED_PREVIEW:
          return `[${node.value}](${prefix}${node.fname})`;
        default:
          throw new DendronError({ message: "Unable to render user tag" });
      }
    };
  }
}

export { plugin as userTags };
export { PluginOpts as UserTagOpts };
