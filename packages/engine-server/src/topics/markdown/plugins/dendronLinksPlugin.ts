import { DNoteLoc } from "@dendronhq/common-all";
import { removeMDExtension } from "@dendronhq/common-server";
import _ from "lodash";
import RemarkParser, { Eat } from "remark-parse";
import { Parser, Processor } from "unified";
import { Node } from "unist";

export const LINK_REGEX = /^\[\[(.+?)\]\]/;

declare class RemarkParserClass implements Parser {
  Parser: RemarkParserClass;
  prototype: RemarkParserClass;
  parse(): Node;
  blockMethods: string[];
  inlineTokenizers: {
    [key: string]: RemarkParser.Tokenizer;
  };

  inlineMethods: string[];
}

export type WikiLinkNote = Node & {
  data: WikiLinkData;
  value: string;
};

export type WikiLinkProps = {
  alias: string;
  value: string;
  anchorHeader?: string;
};

export type WikiLinkData = {
  alias: string;
  permalink: string;
  exists: boolean;
  hName: string;
  hProperties: any;
  hChildren: any[];
  anchorHeader?: string;

  // dendron specific
  toMd?: boolean;
  toHTML?: boolean;
  prefix?: string;
  useId: boolean;
  note?: { id: string };
  replace?: DNoteLoc;
  forNoteRefInPreview?: boolean;
  forNoteRefInSite?: boolean;
};

function locator(value: string, fromIndex: number) {
  return value.indexOf("[", fromIndex);
}

interface PluginOpts {
  permalinks?: string[];
  pageResolver?: (name: string) => string[];
  newClassName?: string;
  wikiLinkClassName?: string;
  hrefTemplate?: (permalink: string) => string;
  aliasDivider?: string;
  // dendron opts
  replaceLink?: { from: DNoteLoc; to: DNoteLoc };
  convertObsidianLinks?: boolean;
}

export { PluginOpts as DendronLinksOpts };

function genLinkValue(value: string, data: WikiLinkData) {
  if (data.anchorHeader) {
    value = value += `#${data.anchorHeader}`;
  }
  return value;
}

/**
 * Matches wiki-links
 * @param opts
 */
export function dendronLinksPlugin(opts: Partial<PluginOpts> = {}) {
  const permalinks = opts.permalinks || [];
  const defaultPageResolver = (name: string) => [
    name.replace(/ /g, "").toLowerCase(),
  ];
  const pageResolver = opts.pageResolver || defaultPageResolver;
  const newClassName = opts.newClassName || "new";
  const wikiLinkClassName = opts.wikiLinkClassName || "internal";
  const defaultHrefTemplate = (permalink: string) => `#/page/${permalink}`;
  const hrefTemplate = opts.hrefTemplate || defaultHrefTemplate;
  const aliasDivider = opts.aliasDivider || "|";
  const copts = _.defaults(opts, { convertObsidianLinks: false });

  function isAlias(pageTitle: string) {
    return pageTitle.indexOf(aliasDivider) !== -1;
  }

  function parseAliasLink(pageTitle: string) {
    const [alias, value] = pageTitle.split(aliasDivider);
    return { alias, value };
  }

  function parsePageTitle(pageTitle: string) {
    let out: WikiLinkProps = {
      value: pageTitle,
      alias: pageTitle,
    };
    if (isAlias(pageTitle)) {
      out = parseAliasLink(pageTitle);
    }
    if (out.value.indexOf("#") !== -1) {
      const [value, anchorHeader] = out.value.split("#");
      out.value = value;
      out.anchorHeader = anchorHeader;
    }
    return out;
  }

  function inlineTokenizer(eat: Eat, value: string) {
    const match = LINK_REGEX.exec(value);

    if (match) {
      const pageName = match[1].trim();
      const { value, alias, anchorHeader } = parsePageTitle(pageName);

      const pagePermalinks = pageResolver(value);
      let permalink = pagePermalinks.find((p) => permalinks.indexOf(p) !== -1);
      const exists = permalink !== undefined;

      if (!exists) {
        permalink = pagePermalinks[0];
      }

      let classNames = wikiLinkClassName;
      if (!exists) {
        classNames += " " + newClassName;
      }
      // normalize
      if (permalink) {
        permalink = removeMDExtension(permalink);
      }

      return eat(match[0])({
        type: "wikiLink",
        value,
        data: {
          alias,
          permalink,
          anchorHeader,
          exists,
          hName: "a",
          hProperties: {
            className: classNames,
            href: hrefTemplate(permalink as string),
          },
          hChildren: [
            {
              type: "text",
              value: alias,
            },
          ],
        },
      });
    }
    return;
  }

  inlineTokenizer.locator = locator;

  // @ts-ignore
  let _this = (this as any) as RemarkParserClass;
  const Parser: RemarkParser.Parser = _this.Parser;
  // @ts-ignore
  const inlineTokenizers = Parser.prototype.inlineTokenizers;
  // @ts-ignore
  const inlineMethods = Parser.prototype.inlineMethods;
  inlineTokenizers.wikiLink = inlineTokenizer;
  inlineMethods.splice(inlineMethods.indexOf("link"), 0, "wikiLink");

  // Stringify for wiki link
  // @ts-ignore
  const Compiler: Processor["Compiler"] = _this.Compiler;

  if (Compiler != null) {
    const visitors = Compiler.prototype.visitors;
    if (visitors) {
      visitors.wikiLink = function (node: Node) {
        const data = node.data as WikiLinkData;
        if (!node || !node.data || !node.data.alias) {
          throw Error(`no alias found: ${JSON.stringify(node)}`);
        }
        if (data.useId) {
          if (!data.note) {
            throw Error("no note");
          }
          node.value = data.note.id;
        }
        if (opts.replaceLink && opts.replaceLink.from.fname === node.value) {
          // TODO: check for case
          node.value = opts.replaceLink.to.fname;
          if (node.data.alias === opts.replaceLink.from.fname) {
            node.data.alias = opts.replaceLink.to.fname;
          }
        }
        const nodeValue = genLinkValue(node.value as string, data);
        if (data.toMd) {
          return `[${data.alias}](${data.prefix || ""}${nodeValue})`;
        }
        if (data.forNoteRefInPreview) {
          return `${data.prefix || ""}${node.value}.md`;
        }
        if (data.forNoteRefInSite) {
          return `${data.prefix || ""}${node.value}.html`;
        }
        if (data.toHTML) {
          return `${data.prefix || ""}${node.value}.html`;
        }

        if (node.data.alias !== node.value) {
          return `[[${node.data.alias}${aliasDivider}${nodeValue}]]`;
        }
        if (copts.convertObsidianLinks) {
          node.value = _.replace(node.value as string, /\//g, ".");
        }
        return `[[${nodeValue}]]`;
      };
    }
  }
}
