import {
  ConfigUtils,
  CONSTANTS,
  DendronError,
  NoteUtils,
  Position,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { Eat } from "remark-parse";
import Unified, { Plugin } from "unified";
import {
  DendronASTDest,
  DendronASTTypes,
  WikiLinkDataV4,
  WikiLinkNoteV4,
} from "../types";
import { MDUtilsV5, ProcMode } from "../utilsv5";
import { addError, getNoteOrError, LinkUtils } from "./utils";

export const LINK_REGEX = /^\[\[([^\]\n]+)\]\]/;
/**
 * Does not require wiki link be the start of the word
 */
export const LINK_REGEX_LOOSE = /\[\[([^\]\n]+)\]\]/;

const parseWikiLink = (linkMatch: string) => {
  linkMatch = NoteUtils.normalizeFname(linkMatch);
  return LinkUtils.parseLinkV2({ linkString: linkMatch });
};

export const matchWikiLink = (text: string) => {
  const match = LINK_REGEX_LOOSE.exec(text);
  if (match) {
    const start = match.index;
    const end = match.index + match[0].length;
    const linkMatch = match[1].trim();
    const link = parseWikiLink(linkMatch);
    return { link, start, end };
  }
  return false;
};

type PluginOpts = CompilerOpts;

type CompilerOpts = {
  convertObsidianLinks?: boolean;
  useId?: boolean;
  prefix?: string;
  convertLinks?: boolean;
};

function normalizeSpaces(link: string) {
  return link.replace(/ /g, "%20");
}

const plugin: Plugin<[CompilerOpts?]> = function (
  this: Unified.Processor,
  opts?: PluginOpts
) {
  attachParser(this);
  if (this.Compiler != null) {
    attachCompiler(this, opts);
  }
};

function attachCompiler(proc: Unified.Processor, opts?: CompilerOpts) {
  const copts = _.defaults(opts || {}, {
    convertObsidianLinks: false,
    useId: false,
  });
  const Compiler = proc.Compiler;
  const visitors = Compiler.prototype.visitors;
  if (visitors) {
    visitors.wikiLink = function (node: WikiLinkNoteV4) {
      const pOpts = MDUtilsV5.getProcOpts(proc);
      const data = node.data;
      let value = node.value;

      if (pOpts.mode === ProcMode.NO_DATA) {
        const { alias, anchorHeader } = data;
        const link = value;
        const calias = alias !== value ? `${alias}|` : "";
        const anchor = anchorHeader ? `#${anchorHeader}` : "";
        const vaultPrefix = data.vaultName
          ? `${CONSTANTS.DENDRON_DELIMETER}${data.vaultName}/`
          : "";
        return `[[${calias}${vaultPrefix}${link}${anchor}]]`;
      }

      const { dest, vault } = MDUtilsV5.getProcData(proc);

      // if converting back to dendron md, no further processing
      if (dest === DendronASTDest.MD_DENDRON) {
        return LinkUtils.renderNoteLink({
          link: {
            from: {
              fname: value,
              alias: data.alias,
              anchorHeader: data.anchorHeader,
              vaultName: data.vaultName,
            },
            data: {
              xvault: !_.isUndefined(data.vaultName),
            },
            type: LinkUtils.astType2DLinkType(DendronASTTypes.WIKI_LINK),
            position: node.position as Position,
          },
          dest,
        });
      }

      const { engine } = MDUtilsV5.getProcData(proc);
      if (!engine) {
        return "error with engine";
      }

      if (copts.useId && dest === DendronASTDest.HTML) {
        // TODO: check for vault
        const notes = NoteUtils.getNotesByFnameFromEngine({
          fname: value,
          vault,
          engine,
        });
        const { error, note } = getNoteOrError(notes, value);
        if (error) {
          addError(proc, error);
          return "error with link";
        } else {
          value = note!.id;
        }
      }

      switch (dest) {
        case DendronASTDest.MD_REGULAR: {
          const alias = data.alias ? data.alias : value;
          return `[${alias}](${copts.prefix || ""}${normalizeSpaces(value)})`;
        }
        case DendronASTDest.HTML: {
          const alias = data.alias ? data.alias : value;
          return `[${alias}](${copts.prefix || ""}${value}.html${
            data.anchorHeader ? "#" + data.anchorHeader : ""
          })`;
        }
        default:
          return `unhandled case: ${dest}`;
      }
    };
  }
}

function attachParser(proc: Unified.Processor) {
  function locator(value: string, fromIndex: number) {
    return value.indexOf("[", fromIndex);
  }

  function parseLink(linkMatch: string) {
    const pOpts = MDUtilsV5.getProcOpts(proc);
    linkMatch = NoteUtils.normalizeFname(linkMatch);
    const out = LinkUtils.parseLinkV2({ linkString: linkMatch });
    if (_.isNull(out)) {
      throw new DendronError({ message: `link is null: ${linkMatch}` });
    }
    if (pOpts.mode === ProcMode.NO_DATA) {
      return out;
    }

    const procData = MDUtilsV5.getProcData(proc);
    let { vault } = procData;
    const engine = procData.engine;
    const { config, dest, fname } = procData;
    if (out.vaultName) {
      const maybeVault = VaultUtils.getVaultByName({
        vaults: engine.vaults,
        vname: out.vaultName,
      });
      if (_.isUndefined(maybeVault)) {
        addError(
          proc,
          new DendronError({
            message: `fname: ${fname}, vault ${
              out.vaultName
            } not found in ${JSON.stringify(out)}`,
          })
        );
      } else {
        vault = maybeVault;
      }
      // default to current note
    }
    if (!out.value) {
      // same file block reference, value is implicitly current file
      out.value = _.trim(NoteUtils.normalizeFname(fname)); // recreate what value (and alias) would have been parsed
      if (!out.alias) out.alias = out.value;
    }
    const shouldApplyPublishingRules =
      MDUtilsV5.shouldApplyPublishingRules(proc);
    const enableNoteTitleForLink = ConfigUtils.getEnableNoteTitleForLink(
      config,
      shouldApplyPublishingRules
    );

    if (
      dest !== DendronASTDest.MD_DENDRON &&
      enableNoteTitleForLink &&
      out.alias === out.value &&
      vault
    ) {
      const note = NoteUtils.getNoteByFnameFromEngine({
        fname: out.value,
        engine,
        vault,
      });
      if (note) {
        out.alias = note.title;
      }
    }
    return out;
  }

  function inlineTokenizer(eat: Eat, value: string) {
    const match = LINK_REGEX.exec(value);
    if (match) {
      const linkMatch = match[1].trim();
      try {
        const { value, alias, anchorHeader, vaultName, sameFile } =
          parseLink(linkMatch);
        return eat(match[0])({
          type: DendronASTTypes.WIKI_LINK,
          // @ts-ignore
          value,
          data: {
            alias,
            anchorHeader,
            vaultName,
            sameFile,
          } as WikiLinkDataV4,
        });
      } catch {
        // Broken link, just refuse to parse it
        return;
      }
    }
    return;
  }
  inlineTokenizer.locator = locator;

  const Parser = proc.Parser;
  const inlineTokenizers = Parser.prototype.inlineTokenizers;
  const inlineMethods = Parser.prototype.inlineMethods;
  inlineTokenizers.wikiLink = inlineTokenizer;
  inlineMethods.splice(inlineMethods.indexOf("link"), 0, "wikiLink");
}

export { plugin as wikiLinks };
export { PluginOpts as WikiLinksOpts };
