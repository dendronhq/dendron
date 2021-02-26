import {
  CONSTANTS,
  DendronError,
  NoteUtilsV2,
  VaultUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import { Eat } from "remark-parse";
import Unified, { Plugin } from "unified";
import { DendronASTDest, WikiLinkDataV4, WikiLinkNoteV4 } from "../types";
import { MDUtilsV4 } from "../utils";
import { addError, getNoteOrError, LinkUtils } from "./utils";

export const LINK_REGEX = /^\[\[(.+?)\]\]/;

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
  let { dest, vault } = MDUtilsV4.getDendronData(proc);

  if (visitors) {
    visitors.wikiLink = function (node: WikiLinkNoteV4) {
      const data = node.data;
      let value = node.value;

      // if converting back to dendron md, no further processing
      if (dest === DendronASTDest.MD_DENDRON) {
        const { alias, anchorHeader } = data;
        let link = alias !== value ? `${alias}|${value}` : value;
        let anchor = anchorHeader ? `#${anchorHeader}` : "";
        let vaultPrefix = data.vaultName
          ? `${CONSTANTS.DENDRON_DELIMETER}${data.vaultName}/`
          : "";
        return `[[${vaultPrefix}${link}${anchor}]]`;
      }

      const { error, engine } = MDUtilsV4.getEngineFromProc(proc);
      if (error) {
        addError(proc, error);
        return "error with engine";
      }

      if (copts.useId) {
        // TODO: check for vault
        const notes = NoteUtilsV2.getNotesByFname({
          fname: value,
          notes: engine.notes,
          vault,
        });
        const { error, note } = getNoteOrError(notes, value);
        if (error) {
          addError(proc, error);
          return "error with link";
          // TODO: hack
          // currently we don't check if wiki links are publishable inside a note ref
          // will lead to us trying to publish a ref that can't be accessed
          return "";
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
              vaults: engine.vaultsv3,
              vname: data.vaultName,
            });
            cleanValue = path.join(
              vault2Path({ vault: vaultByName!, wsRoot: engine.wsRoot }),
              cleanValue
            );
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
    linkMatch = NoteUtilsV2.normalizeFname(linkMatch);

    const out = LinkUtils.parseLinkV2(linkMatch);
    if (_.isNull(out)) {
      throw new DendronError({ msg: `link is null: ${linkMatch}` });
    }
    let { config, vault, dest, fname } = MDUtilsV4.getDendronData(proc);
    const { engine } = MDUtilsV4.getEngineFromProc(proc);
    if (out.vaultName) {
      const maybeVault = VaultUtils.getVaultByName({
        vaults: engine.vaultsv3,
        vname: out.vaultName,
      });
      if (_.isUndefined(maybeVault)) {
        throw new DendronError({
          msg: `fname: ${fname}, vault ${
            out.vaultName
          } not found in ${JSON.stringify(out)}`,
        });
      }
      vault = maybeVault;
    }
    if (
      dest !== DendronASTDest.MD_DENDRON &&
      config?.useNoteTitleForLink &&
      out.alias === out.value &&
      vault
    ) {
      const wsRoot = engine.wsRoot;
      const note = NoteUtilsV2.getNoteByFnameV5({
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
        type: "wikiLink",
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
