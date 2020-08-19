import RemarkParser, { Eat } from "remark-parse";
import { Processor } from "unified";
import { Node } from "unist";
import { Note } from "@dendronhq/common-all";
import { removeMDExtension } from "@dendronhq/common-server";

const LINK_REGEX = /^\[\[(.+?)\]\]/;

export type WikiLinkData = {
  alias: string;
  permalink: string;
  exists: boolean;
  hName: string;
  hProperties: any;
  hChildren: any[];
  toMd?: boolean;
  prefix?: string;
  useId: boolean;
  note?: Note;
};

function locator(value: string, fromIndex: number) {
  return value.indexOf("[", fromIndex);
}

interface PluginOpts {
  permalinks: string[];
  pageResolver: (name: string) => string[];
  newClassName: string;
  wikiLinkClassName: string;
  hrefTemplate: (permalink: string) => string;
  aliasDivider: string;
}

export function dendronLinksPlugin(opts: Partial<PluginOpts> = {}) {
  const permalinks = opts.permalinks || [];
  const defaultPageResolver = (name: string) => [
    name.replace(/ /g, "_").toLowerCase(),
  ];
  const pageResolver = opts.pageResolver || defaultPageResolver;
  const newClassName = opts.newClassName || "new";
  const wikiLinkClassName = opts.wikiLinkClassName || "internal";
  const defaultHrefTemplate = (permalink: string) => `#/page/${permalink}`;
  const hrefTemplate = opts.hrefTemplate || defaultHrefTemplate;
  const aliasDivider = opts.aliasDivider || "|";

  function isAlias(pageTitle: string) {
    return pageTitle.indexOf(aliasDivider) !== -1;
  }

  function parseAliasLink(pageTitle: string) {
    const [displayName, name] = pageTitle.split(aliasDivider);
    return { name, displayName };
  }

  function parsePageTitle(pageTitle: string) {
    if (isAlias(pageTitle)) {
      return parseAliasLink(pageTitle);
    }
    return {
      name: pageTitle,
      displayName: pageTitle,
    };
  }

  function inlineTokenizer(eat: Eat, value: string) {
    const match = LINK_REGEX.exec(value);

    if (match) {
      const pageName = match[1].trim();
      const { name, displayName } = parsePageTitle(pageName);

      const pagePermalinks = pageResolver(name);
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
        value: name,
        data: {
          alias: displayName,
          permalink,
          exists,
          hName: "a",
          hProperties: {
            className: classNames,
            href: hrefTemplate(permalink as string),
          },
          hChildren: [
            {
              type: "text",
              value: displayName,
            },
          ],
        },
      });
    }
    return;
  }

  inlineTokenizer.locator = locator;

  // @ts-ignore
  const Parser: RemarkParser.Parser = this.Parser;

  // @ts-ignore
  const inlineTokenizers = Parser.prototype.inlineTokenizers;
  // @ts-ignore
  const inlineMethods = Parser.prototype.inlineMethods;
  inlineTokenizers.wikiLink = inlineTokenizer;
  inlineMethods.splice(inlineMethods.indexOf("link"), 0, "wikiLink");

  // Stringify for wiki link
  // @ts-ignore
  const Compiler: Processor["Compiler"] = this.Compiler;

  if (Compiler != null) {
    const visitors = Compiler.prototype.visitors;
    if (visitors) {
      // eslint-disable-next-line func-names
      visitors.wikiLink = function (node: Node) {
        const data = node.data as WikiLinkData;
        if (!node || !node.data || !node.data.alias) {
          throw Error("no alias found");
        }
        if (data.useId) {
          if (!data.note) {
            throw Error("no note");
          }
          node.value = data.note.id;
        }
        if (data.toMd) {
          return `[${data.alias}](${data.prefix || ""}${node.value})`;
        }

        if (node.data.alias !== node.value) {
          return `[[${node.data.alias}${aliasDivider}${node.value}]]`;
        }
        return `[[${node.value}]]`;
      };
    }
  }
}
