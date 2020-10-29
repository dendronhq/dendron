/* eslint-disable camelcase */
import { DNodeUtils, LinkType, Note, ProtoLink } from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import _markdownit from "markdown-it";
import markdownItRegex from "markdown-it-regex";
import Token from "markdown-it/lib/token";
import os from "os";
import remark from "remark";
import abbrPlugin from "remark-abbr";
import frontmatterPlugin from "remark-frontmatter";
import markdownParse from "remark-parse";
// import wikiLinkPlugin from "remark-wiki-link";
import unified, { Processor } from "unified";
import { Node, Parent, Point, Position } from "unist";
import visit, { CONTINUE, EXIT } from "unist-util-visit";
import YAML from "yamljs";
import { dendronLinksPlugin } from "./plugins/dendronLinksPlugin";
import { dendronRefsPlugin } from "./plugins/dendronRefsPlugin";
import { ReplaceRefOptions } from "./plugins/replaceRefs";
import { MDRenderer } from "./renderer";

enum NodeType {
  code_inline = "code_inline",
  code_block = "code_block",
  fence = "fence",
  image = "image",
  hardbreak = "hardbreak",
  softbreak = "softbreak",
  text = "text",
  html_block = "html_block",
  html_inline = "html_inline",
}

let processor: unified.Processor | null = null;

export type MDNode = {
  nodeType: NodeType;
  openNode: Token;
  closeNode: Token;
  children: Token[];
};

export function md() {
  return _markdownit();
}

export function tokens2MD(tokens: Token[]): string {
  return _.trim(new MDRenderer().render(tokens, {}, {}));
}

export function md2Tokens(txt: string): Token[] {
  const markdownIt = _markdownit();
  const tokens: Token[] = markdownIt
    .use(markdownItRegex, {
      name: "ref-document",
      // eslint-disable-next-line no-useless-escape
      regex: /\[\[([^\[\]]+?)\]\]/,
      // replace: (rawRef: string) => {
      //   const { ref, label } = parseRef(rawRef);
      //   // const fsPath = findUriByRef(getWorkspaceCache().allUris, ref)?.fsPath;
      //   // if (!fsPath) {
      //   //   return getInvalidRefAnchor(label || ref);
      //   // }
      //   return getRefAnchor(ref, label || ref);
      // },
    })
    .parse(txt, {});
  return tokens;
}

// export function replaceMDRefs(opts: ReplaceMDRefsOpts): Token[] {
//   const { tokens, imageLinkPrefix } = opts;
//   const reImg = new RegExp("((?<link>.*))");
//   tokens.map((t) => {
//     if (t.type === "inline") {
//       const children: Token[] = t.children ? t.children : [];
//       if (children[0]?.type === "image" && imageLinkPrefix) {
//         const attrs = children[0].attrs;
//         const oldSrcAtt = _.find(attrs, (u) => u[0] === "src");
//         const [_skip, oldSrc] = oldSrcAtt;
//         const newSrc = imageLinkPrefix + oldSrc;
//         // const match = reImg.exec(t.content);
//         // if (!match || !match.groups) {
//         //   throw Error(`no image found for token ${t}`);
//         // }
//         // const newLink = imageLinkPrefix + match.groups["link"];
//         t.content = t.content.replace(`(${oldSrc})`, `(${newSrc})`);
//       }
//     }

//     //   (!_.isEmpty(t.children)) &&
//     //   (t.children[0].type === "image") &&
//     //   imageLinkPrefix
//     // ) {
//     // }
//   });
//   return tokens;
// }

export function parse(markdown: string): Node {
  processor =
    processor ||
    unified()
      .use(markdownParse, { gfm: true })
      .use(abbrPlugin)
      .use(frontmatterPlugin, ["yaml"])
      .use(dendronLinksPlugin);
  return processor.parse(markdown);
}

// export async function process(node: Node) {
//   const streamIn = new PassThrough();
//   streamIn.write("# foo bar");

//   return new Promise((resolve) => {
//     engine(
//       {
//         processor: remark(),
//         streamIn,
//         pluginPrefix: "remark",
//         rcName: ".remarkrc",
//         packageField: "remarkConfig",
//         ignoreName: ".remarkignore",
//         color: true,
//       },
//       // eslint-disable-next-line no-use-before-define
//       done
//     );

//     function done(error: any) {
//       if (error) throw error;
//       resolve();
//     }
//   });
// }

// TODO: stub
function uriToSlug(uri: string) {
  return uri;
}

export function createNoteFromMarkdown(uri: string, eol?: string): Note {
  // eslint-disable-next-line prefer-const
  const markdown = fs.readFileSync(uri, { encoding: "utf8" });
  eol = eol || os.EOL;

  const tree = parse(markdown);
  let title: string | null = null;
  let frontmatter: any = {};

  visit(tree, (node) => {
    if (node.type === "heading" && node.depth === 1) {
      if (_.isNull(title)) {
        title = ((node as Parent)!.children[0].value as string) || title;
      }
    }
    return title === null ? CONTINUE : EXIT;
  });

  const links: ProtoLink[] = [];
  let start: Point = { line: 1, column: 1, offset: 0 }; // start position of the note

  visit(tree, (node) => {
    if (node.type === "yaml") {
      frontmatter = YAML.parse(node.value as string) ?? {}; // parseYAML returns null if the frontmatter is empty
      if (frontmatter.tite) {
        title = frontmatter.title;
      }
      // Update the start position of the note by exluding the metadata
      start = {
        line: node.position!.end.line! + 1,
        column: 1,
        offset: node.position!.end.offset! + 1,
      };
    }

    if (node.type === "image") {
      links.push({
        type: LinkType.IMAGE_LINK,
        url: node.url as string,
        alt: node.alt as string,
        position: node.position!,
      });
    }

    if (node.type === "wikiLink") {
      let maybeLbl: string | undefined;
      let maybeUrl: string | undefined;
      [maybeLbl, maybeUrl] = (node.value as string).split("|");
      if (_.isUndefined(maybeUrl)) {
        maybeUrl = maybeLbl;
        maybeLbl = undefined;
      }
      links.push({
        type: LinkType.WIKI_LINK,
        position: node.position!,
        url: maybeUrl,
      });
    }

    // if (node.type === "definition") {
    //   linkDefinitions.push({
    //     label: node.label as string,
    //     url: node.url as string,
    //     title: node.title as string,
    //     position: node.position,
    //   });
    // }
  });

  // Give precendence to the title from the frontmatter if it exists
  // title = frontmatter.title ?? title;

  const end = tree.position!.end;
  // const definitions = getFoamDefinitions(linkDefinitions, end);

  const props = {
    properties: frontmatter,
    slug: uriToSlug(uri),
    title,
    links,
    source: {
      tree,
      uri,
      text: markdown,
      contentStart: start,
      end,
      eol,
    },
  };
  const fname = DNodeUtils.basename(props.source.uri, true);
  const note = new Note({ fname });
  note.custom.props = props;
  return note;
}

// === Text Edits

// export const generateLinkPrefix = (
//   note: Note,
//   links: ProtoLink[],
//   prefix: string
// ): string => {
//   const imageRe = new RegExp(/(\([^)]+\))/);
//   let text = [];
//   links.map((l) => {
//     const source = NoteUtils.protoGetSource(note);
//     const { position, url } = l;
//     // const match = imageRe.exec(url);
//     // if (!match) {
//     //   throw Error("bad image url");
//     // }
//     const { start, end } = position;
//     const oldLink = source.text.slice(start.offset, end.offset);
//     const newUrl = [prefix, url].join("");
//     // const capture = match[1];
//     const newLink = oldLink.replace(`(${url})`, `(${newUrl})`);
//     console.log("foo");
//     // eslint-disable-next-line no-use-before-define
//     const newText = applyTextEdit(source.text, {
//       newText: newLink,
//       range: {
//         start,
//         end,
//       },
//     });
//   });
//   return [];
// };

// export const generateHeading = (note: Note): TextEdit | null => {
//   if (!note) {
//     return null;
//   }

//   if (note.title) {
//     return null;
//   }

//   const frontmatterExists = note.source.contentStart.line !== 1;

//   let newLineExistsAfterFrontmatter = false;
//   if (frontmatterExists) {
//     const lines = note.source.text.split(note.source.eol);
//     const index = note.source.contentStart.line - 1;
//     const line = lines[index];
//     newLineExistsAfterFrontmatter = line === "";
//   }

//   const paddingStart = frontmatterExists ? note.source.eol : "";
//   const paddingEnd = newLineExistsAfterFrontmatter
//     ? note.source.eol
//     : `${note.source.eol}${note.source.eol}`;

//   return {
//     newText: `${paddingStart}# ${getHeadingFromFileName(
//       note.slug
//     )}${paddingEnd}`,
//     range: {
//       start: note.source.contentStart,
//       end: note.source.contentStart,
//     },
//   };
// };

export interface TextEdit {
  range: Position;
  newText: string;
}

export const applyTextEdit = (text: string, textEdit: TextEdit): string => {
  const characters = text.split("");
  const startOffset = textEdit.range.start.offset || 0;
  const endOffset = textEdit.range.end.offset || 0;
  const deleteCount = endOffset - startOffset;

  const textToAppend = `${textEdit.newText}`;
  characters.splice(startOffset, deleteCount, textToAppend);
  return characters.join("");
};

export function getProcessor(opts?: {
  root?: string;
  renderWithOutline?: boolean;
  replaceRefs?: ReplaceRefOptions;
}): Processor {
  const { root, renderWithOutline, replaceRefs } = opts || {};
  return remark()
    .use(markdownParse, { gfm: true })
    .use(abbrPlugin)
    .use(frontmatterPlugin, ["yaml"])
    .use(dendronLinksPlugin)
    .use(dendronRefsPlugin, { root, renderWithOutline, replaceRefs })
    .use({ settings: { listItemIndent: "1", fences: true } });
}
