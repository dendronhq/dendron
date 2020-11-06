import { DNoteRefLink } from "@dendronhq/common-all";
import { removeMDExtension } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import { Parent } from "mdast";
import {
  brk,
  heading,
  paragraph,
  root as mdastRoot,
  text,
} from "mdast-builder";
import { RefLinkData } from "packages/engine-server/lib/topics/markdown/plugins/dendronNoteRefPlugin";
import path from "path";
import RemarkParser, { Eat } from "remark-parse";
import { Processor } from "unified";
import { Node } from "unist";
import { parseDendronRef } from "../../../utils";
import { getProcessor } from "../utils";
import { findIndex, isHeading } from "./inject";
import { ReplaceRefOptions, replaceRefs } from "./replaceRefs";

// const LINK_REGEX = /^\[\[(.+?)\]\]/;
const LINK_REGEX = /^\(\((?<ref>[^)]+)\)\)/;

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
  root?: string;
  renderWithOutline?: boolean;
  refLvl?: number;
  replaceRefs?: ReplaceRefOptions;
}

const aliasDivider = "|";
function isAlias(pageTitle: string) {
  return pageTitle.indexOf(aliasDivider) !== -1;
}

/**
 * Find part of body to extract
 * @param opts
 */
function extractNoteRef(opts: {
  body: string;
  link: DNoteRefLink;
  replaceRefs?: ReplaceRefOptions;
}) {
  const { body, link } = opts;
  let proc = getProcessor();
  const bodyAST: Parent = proc.parse(body) as Parent;
  // bumpHeadings(bodyAST, 2);
  const { anchorStart, anchorEnd, anchorStartOffset } = link.data;
  let anchorStartIndex = bodyAST.children[0].type === "yaml" ? 1 : 0;
  let anchorEndIndex = bodyAST.children.length;
  if (anchorStart) {
    anchorStartIndex = findIndex(bodyAST.children as any[], function (
      node: Node
    ) {
      return isHeading(node, anchorStart);
    });
    if (anchorStartIndex < 0) {
      return proc.stringify(
        genMDError({
          msg: `start anchor ${anchorStart} not found`,
          title: "Note Ref Error",
        })
      );
    }
  }
  if (anchorEnd) {
    anchorEndIndex = findIndex(
      bodyAST.children.slice(anchorStartIndex + 1) as any[],
      function (node: Node) {
        return isHeading(node, anchorEnd);
      }
    );
    if (anchorEndIndex < 0) {
      const mdError = genMDError({
        msg: `end anchor ${anchorEnd} not found`,
        title: "Note Ref Error",
      });
      return proc.stringify(mdError);
    }
    anchorEndIndex += anchorStartIndex + 1;
  }
  bodyAST.children = bodyAST.children.slice(anchorStartIndex, anchorEndIndex);

  // convert content inside block
  let outProc = getProcessor();
  if (!_.isUndefined(opts.replaceRefs)) {
    outProc = outProc.use(replaceRefs, opts.replaceRefs);
  }
  try {
    let out = outProc.processSync(outProc.stringify(bodyAST)).toString();
    if (anchorStartOffset) {
      out = out.split("\n").slice(anchorStartOffset).join("\n");
    }
    return out;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

function genMDError(opts: { msg: string; title: string }) {
  const { msg, title } = opts;
  return mdastRoot([
    heading(3, text(title)),
    paragraph([paragraph(text(msg)), brk]),
  ]);
}

function parseAliasLink(pageTitle: string) {
  const [displayName, name] = pageTitle.split(aliasDivider);
  return { name, displayName };
}

export function parsePageTitle(pageTitle: string) {
  if (isAlias(pageTitle)) {
    return parseAliasLink(pageTitle);
  }
  return {
    name: pageTitle,
    displayName: pageTitle,
  };
}

export function dendronRefsPlugin(opts: Partial<PluginOpts> = {}) {
  const permalinks = opts.permalinks || [];
  const defaultPageResolver = (name: string) => [
    name.replace(/ /g, "").toLowerCase(),
  ];
  const pageResolver = opts.pageResolver || defaultPageResolver;
  const newClassName = opts.newClassName || "new";
  const renderWithOutline = opts.renderWithOutline || false;
  const wikiLinkClassName = opts.wikiLinkClassName || "internal";
  const defaultHrefTemplate = (permalink: string) => `#/page/${permalink}`;
  const hrefTemplate = opts.hrefTemplate || defaultHrefTemplate;
  const root: string | undefined = opts.root;

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
        if (!data?.link?.from.fname) {
          throw Error("no link name foundjj");
        }
        let name = data.link.from.fname;
        const body = fs.readFileSync(path.join(root, name + ".md"), {
          encoding: "utf8",
        });
        const out = extractNoteRef({
          body,
          link: data.link,
          replaceRefs: opts.replaceRefs,
        });
        if (renderWithOutline) {
          let link = name;
          // convert link
          if (!_.isUndefined(opts.replaceRefs)) {
            link = _.trim(
              getProcessor()
                .use(replaceRefs, {
                  ..._.omit(opts.replaceRefs, "wikiLink2Md"),
                  wikiLink2Html: true,
                })
                .processSync(`[[${link}]]`)
                .toString()
            );
          } else {
            link += ".md";
          }
          return doRenderWithOutline({
            content: out,
            title: data.link.from.alias || data.link.from.fname || "no title",
            link,
          });
        }
        return out;
      };
    }
  }
}

function doRenderWithOutline(opts: {
  content: string;
  title: string;
  link: string;
}) {
  const { content, title, link } = opts;
  return `

<div class="portal-container">
<div class="portal-head">
<div class="portal-backlink" >
<div class="portal-title">From <span class="portal-text-title">${title}</span></div>
<a href="${link}" class="portal-arrow">Go to text <span class="right-arrow">→</span></a>
</div>
</div>
<div id="portal-parent-anchor" class="portal-parent" markdown="1">
<div class="portal-parent-fader-top"></div>
<div class="portal-parent-fader-bottom"></div>        
  
${content}

</div>    
</div>
`;
}
