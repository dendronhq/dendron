import _ from "lodash";
import { DendronError, NoteUtilsV2 } from "@dendronhq/common-all";
import { DEngineClientV2 } from "packages/engine-server/lib";
import { Eat } from "remark-parse";
import Unified, { Plugin } from "unified";
import { WikiLinkProps } from "../../topics/markdown";
import { DendronASTDest, WikiLinkDataV4, WikiLinkNoteV4 } from "../types";
import { addError, getNoteOrError, LinkUtils } from "./utils";
import { MDUtilsV4 } from "../utils";

export const LINK_REGEX = /^\[\[(.+?)\]\]/;

type PluginOpts = CompilerOpts;

type CompilerOpts = {
  convertObsidianLinks?: boolean;
  dest?: DendronASTDest;
  useId?: boolean;
  prefix?: string;
};

const plugin: Plugin = function (this: Unified.Processor, opts?: PluginOpts) {
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
      const data = node.data;
      let value = node.value;
      const { error, engine } = MDUtilsV4.getEngineFromProc(proc);
      if (error) {
        addError(proc, error);
        return "error with engine";
      }

      if (copts.useId) {
        const notes = NoteUtilsV2.getNotesByFname({
          fname: value,
          notes: engine.notes,
        });
        const { error, note } = getNoteOrError(notes, value);
        if (error) {
          addError(proc, error);
          return "error with link";
        } else {
          value = note!.id;
        }
      }

      switch (copts.dest) {
        case DendronASTDest.MD_REGULAR: {
          const alias = data.alias ? data.alias : value;
          return `[${alias}](${copts.prefix || ""}${value})`;
        }
        case DendronASTDest.HTML: {
          const alias = data.alias ? data.alias : value;
          return `[${alias}](${copts.prefix || ""}${value}.html)`;
        }
        default:
          return `unhandled case: ${copts.dest}`;
      }
    };
  }
}

function attachParser(proc: Unified.Processor) {
  function locator(value: string, fromIndex: number) {
    return value.indexOf("[", fromIndex);
  }

  function parseAliasLink(pageTitle: string) {
    const [alias, value] = pageTitle.split("|").map(_.trim);
    return { alias, value: NoteUtilsV2.normalizeFname(value) };
  }

  function parseLink(linkMatch: string) {
    linkMatch = NoteUtilsV2.normalizeFname(linkMatch);
    let out: WikiLinkProps = {
      value: linkMatch,
      alias: linkMatch,
    };
    if (LinkUtils.isAlias(linkMatch)) {
      out = parseAliasLink(linkMatch);
    }
    if (out.value.indexOf("#") !== -1) {
      const [value, anchorHeader] = out.value.split("#").map(_.trim);
      out.value = value;
      out.anchorHeader = anchorHeader;
      // if we didn't have an alias, links with a # anchor shouldn't have # portion be in the title
      if (!LinkUtils.isAlias(linkMatch)) {
        out.alias = value;
      }
    }
    return out;
  }

  function inlineTokenizer(eat: Eat, value: string) {
    const match = LINK_REGEX.exec(value);
    if (match) {
      const linkMatch = match[1].trim();
      const { value, alias, anchorHeader } = parseLink(linkMatch);
      return eat(match[0])({
        type: "wikiLink",
        value,
        data: {
          alias,
          anchorHeader,
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
