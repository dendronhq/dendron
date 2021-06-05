import {
  CONSTANTS,
  DendronError,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import { Eat } from "remark-parse";
import Unified, { Plugin } from "unified";
import {
  DendronASTDest,
  WikiLinkDataV4,
  WikiLinkNoteV4,
  DendronASTTypes,
} from "../types";
import { MDUtilsV4 } from "../utils";
import { MDUtilsV5, ProcMode } from "../utilsv5";
import { addError, getNoteOrError, LinkUtils } from "./utils";

export const LINK_REGEX = /^\[\[(.+?)\]\]/;
export const LINK_REGEX_LOOSE = /\[\[(.+?)\]\]/;

const parseWikiLink = (linkMatch: string) => {
  linkMatch = NoteUtils.normalizeFname(linkMatch);
  return LinkUtils.parseLinkV2(linkMatch);
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
};

function parseAnchorIfExist(link: string) {
  if (link.indexOf("#") !== -1) {
    return link.split("#");
  } else {
    return [link, undefined];
  }
}

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
        let link = value;
        let calias = alias !== value ? `${alias}|` : "";
        let anchor = anchorHeader ? `#${anchorHeader}` : "";
        let vaultPrefix = data.vaultName
          ? `${CONSTANTS.DENDRON_DELIMETER}${data.vaultName}/`
          : "";
        return `[[${calias}${vaultPrefix}${link}${anchor}]]`;
      }

      let { dest } = MDUtilsV4.getDendronData(proc);
      const vault = MDUtilsV4.getVault(proc, data.vaultName);
      // if converting back to dendron md, no further processing
      if (dest === DendronASTDest.MD_DENDRON) {
        const { alias, anchorHeader } = data;
        let link = value;
        let calias = alias !== value ? `${alias}|` : "";
        let anchor = anchorHeader ? `#${anchorHeader}` : "";
        let vaultPrefix = data.vaultName
          ? `${CONSTANTS.DENDRON_DELIMETER}${data.vaultName}/`
          : "";
        return `[[${calias}${vaultPrefix}${link}${anchor}]]`;
      }

      const { error, engine } = MDUtilsV4.getEngineFromProc(proc);
      if (error) {
        addError(proc, error);
        return "error with engine";
      }

      if (copts.useId && dest === DendronASTDest.HTML) {
        // TODO: check for vault
        const notes = NoteUtils.getNotesByFname({
          fname: value,
          notes: engine.notes,
          vault,
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
        case DendronASTDest.MD_ENHANCED_PREVIEW: {
          const alias = data.alias ? data.alias : value;
          let cleanValue = normalizeSpaces(
            parseAnchorIfExist(value)[0] as string
          );
          if (data.vaultName) {
            const vaultByName = VaultUtils.getVaultByName({
              vaults: engine.vaults,
              vname: data.vaultName,
            });
            if (_.isUndefined(vaultByName)) {
              return `ERROR: ${vaultByName} is not a vault in this workspace`;
            }
            const cpath = vault2Path({
              wsRoot: engine.wsRoot,
              vault: MDUtilsV4.getVault(proc),
            });
            const npath = vault2Path({
              vault: vaultByName!,
              wsRoot: engine.wsRoot,
            });
            cleanValue = path.join(path.relative(cpath, npath), cleanValue);
          }
          return `[${alias}](${copts.prefix || ""}${cleanValue}.md)`;
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
    const out = LinkUtils.parseLinkV2(linkMatch);
    if (_.isNull(out)) {
      throw new DendronError({ message: `link is null: ${linkMatch}` });
    }
    if (pOpts.mode === ProcMode.NO_DATA) {
      return out;
    }

    let { config, vault, dest, fname } = MDUtilsV5.getProcData(proc);
    const { engine } = MDUtilsV4.getEngineFromProc(proc);
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
      debugger;
      // same file block reference, value is implicitly current file
      out.value = _.trim(NoteUtils.normalizeFname(fname)); // recreate what value (and alias) would have been parsed
      if (!out.alias) out.alias = out.value;
    }
    if (
      dest !== DendronASTDest.MD_DENDRON &&
      config?.useNoteTitleForLink &&
      out.alias === out.value &&
      vault
    ) {
      const wsRoot = engine.wsRoot;
      const note = NoteUtils.getNoteByFnameV5({
        fname: out.value,
        notes: engine.notes,
        vault,
        wsRoot,
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
      const { value, alias, anchorHeader, vaultName } = parseLink(linkMatch);
      return eat(match[0])({
        type: DendronASTTypes.WIKI_LINK,
        value,
        data: {
          alias,
          anchorHeader,
          vaultName,
        } as WikiLinkDataV4,
      });
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
