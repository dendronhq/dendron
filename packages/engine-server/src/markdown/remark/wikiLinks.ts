import { DendronError, NoteUtilsV2 } from "@dendronhq/common-all";
import _ from "lodash";
import { Eat } from "remark-parse";
import Unified, { Plugin } from "unified";
import { WikiLinkProps } from "../../topics/markdown";
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
  const { dest, vault } = MDUtilsV4.getDendronData(proc);

  if (visitors) {
    visitors.wikiLink = function (node: WikiLinkNoteV4) {
      const data = node.data;
      let value = node.value;
      if (dest === DendronASTDest.MD_DENDRON) {
        const { alias, anchorHeader } = data;
        let link = alias !== value ? `${alias}|${value}` : value;
        let anchor = anchorHeader ? `#${anchorHeader}` : "";
        return `[[${link}${anchor}]]`;
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
          return `[${alias}](${copts.prefix || ""}${normalizeSpaces(
            parseAnchorIfExist(value)[0] as string
          )}.md)`;
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
    let out: WikiLinkProps = {
      value: linkMatch,
      alias: linkMatch,
    };

    const match = LinkUtils.parseLinkV2(linkMatch);
    if (_.isNull(match)) {
      throw new DendronError({ msg: `link is null: ${linkMatch}` });
    }
    out = match;
    const { config, vault, dest } = MDUtilsV4.getDendronData(proc);
    if (
      dest !== DendronASTDest.MD_DENDRON &&
      config?.useNoteTitleForLink &&
      out.alias === out.value &&
      vault
    ) {
      const { engine } = MDUtilsV4.getEngineFromProc(proc);
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
      const { value, alias, anchorHeader, filters } = parseLink(linkMatch);
      return eat(match[0])({
        type: "wikiLink",
        value,
        data: {
          alias,
          anchorHeader,
          filters,
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
