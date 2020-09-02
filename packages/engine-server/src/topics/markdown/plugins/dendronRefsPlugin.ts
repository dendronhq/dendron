import { Note } from "@dendronhq/common-all";
import { removeMDExtension } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import { Parent } from "mdast";
import path from "path";
import RemarkParser, { Eat } from "remark-parse";
import { Processor } from "unified";
import { Node } from "unist";
import { DendronRefLink, parseDendronRef } from "../../../utils";
import { getProcessor } from "../utils";
import { findIndex, isHeading } from "./inject";

// const LINK_REGEX = /^\[\[(.+?)\]\]/;
const LINK_REGEX = /^\(\((?<ref>[^)]+)\)\)/;

type RefLinkData = {
  link: DendronRefLink;
  // --- Old
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
  return value.indexOf("((", fromIndex);
}

interface PluginOpts {
  permalinks: string[];
  pageResolver: (name: string) => string[];
  newClassName: string;
  wikiLinkClassName: string;
  hrefTemplate: (permalink: string) => string;
  aliasDivider: string;
  root: string | undefined;
}

export function dendronRefsPlugin(opts: Partial<PluginOpts> = {}) {
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
  const root: string | undefined = opts.root;

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
      const { link } = parseDendronRef(pageName);
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
        type: "refLink",
        value: name,
        data: {
          alias: displayName,
          link,
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
  inlineTokenizers.refLink = inlineTokenizer;
  inlineMethods.splice(inlineMethods.indexOf("link"), 0, "refLink");

  // Stringify for wiki link
  // @ts-ignore
  const Compiler: Processor["Compiler"] = this.Compiler;

  if (Compiler != null) {
    const visitors = Compiler.prototype.visitors;
    // const headingVisitor = _.bind(visitors.heading, Compiler);
    // let lastHeading: Heading;
    if (visitors) {
      //   visitors.heading = function(node: Heading) {
      //       lastHeading = node;
      //       return headingVisitor(node);
      //   }
      // eslint-disable-next-line func-names
      visitors.refLink = function (node: Node) {
        const data = node.data as RefLinkData;
        if (!root) {
          throw Error("root not defined");
        }
        if (!data?.link?.name) {
          throw Error("no link name foundjj");
        }
        const body = fs.readFileSync(path.join(root, data.link.name + ".md"), {
          encoding: "utf8",
        });
        const bodyAST: Parent = getProcessor().parse(body) as Parent;
        // bumpHeadings(bodyAST, 2);
        const { anchorStart, anchorEnd } = data.link;
        let anchorStartIndex = bodyAST.children[0].type === "yaml" ? 1 : 0;
        let anchorEndIndex = bodyAST.children.length;
        if (anchorStart) {
          anchorStartIndex = findIndex(bodyAST.children as any[], function (
            node: Node
          ) {
            return isHeading(node, anchorStart);
          });
        }
        if (anchorEnd) {
          anchorEndIndex = findIndex(bodyAST.children as any[], function (
            node: Node
          ) {
            return isHeading(node, anchorEnd);
          });
        }
        bodyAST.children = bodyAST.children.slice(
          anchorStartIndex,
          anchorEndIndex
        );

        return getProcessor().stringify(bodyAST);
        // targetAst.children.splice.apply(targetAst.children, [
        //     head + 1, // start splice
        //     (nextHead >= 0 ? nextHead - head : targetAst.children.length - head) - 1 // items to delete
        //   ].concat(toInjectAst.children))

        // inject('Section1', target, newStuff)
        // return `ref link: ${root}`;
        // if (!node || !node.data || !node.data.alias) {
        //   throw Error("no alias found");
        // }
        // if (data.useId) {
        //   if (!data.note) {
        //     throw Error("no note");
        //   }
        //   node.value = data.note.id;
        // }
        // if (data.toMd) {
        //   return `[${data.alias}](${data.prefix || ""}${node.value})`;
        // }

        // if (node.data.alias !== node.value) {
        //   return `[[${node.data.alias}${aliasDivider}${node.value}]]`;
        // }
        // return `[[${node.value}]]`;
      };
    }
  }
}
