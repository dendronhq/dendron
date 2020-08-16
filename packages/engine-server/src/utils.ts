import { createLogger, readMD } from "@dendronhq/common-server";
import _ from "lodash";
import _markdownIt from "markdown-it";
// @ts-ignore
import markdownItAST from "markdown-it-ast";
import markdownItRegex from "markdown-it-regex";
import Token from "markdown-it/lib/token";
import path from "path";
import { parseRef, findUriByRef } from "./external/memo/utils/utils";
import { URI } from "vscode-uri";

process.env["LOG_DST"] = "/tmp/bond.log";
const L = createLogger("bond");

const markdownIt = _markdownIt();
export const VERSION = "BOND";

// const testString = "<!--(([[class.mba.chapters.2]]))-->";

export type DendronRefLink = {
  label?: string;
  id?: string;
  name?: string;
  anchorStart?: string;
  anchorEnd?: string;
  type: "file" | "id";
};

type DendronRef = {
  direction: "from" | "to";
  link: DendronRefLink;
};

export type ASTEnt = {
  nodeType: "heading" | "other";
  openNode: Token;
  closeNode: Token;
  children: Token[];
};

const getRefAnchor = (href: string, text: string) =>
  `<a title="${href}" href="${href}">${text}</a>`;

export const getFileUrlForMarkdownPreview = (filePath: string): string =>
  URI.file(filePath).toString().replace("file://", "");

export function extractBlock(
  txt: string,
  link: DendronRefLink
  //opts?: { linesOnly?: boolean }
): {
  block: string;
  lines?: { start: number | undefined; end: number | undefined };
} {
  const ctx = "extractBlock";
  L.info({ ctx, txt, link });
  // const copts = _.defaults(opts, { linesOnly: false });
  const { anchorStart, anchorEnd } = link;
  if (link.type === "id") {
    throw Error(`id link not supported`);
  } else {
    //txt = _.trim(txt);
    if (!anchorStart) {
      return { block: txt };
    }
    const ast = genAST(txt);
    const clean = {
      anchorStart: _.trim(anchorStart),
      anchorEnd: _.trim(anchorEnd),
    };
    const out: any = {
      anchorStart: null,
      anchorEnd: null,
    };
    ast.forEach((ent) => {
      if (ent.nodeType === "heading") {
        const matchKey: keyof typeof clean = _.isNull(out["anchorStart"])
          ? "anchorStart"
          : "anchorEnd";
        if (_.trim(ent.children[0].content) === clean[matchKey]) {
          out[matchKey] = ent.openNode.map;
        }
      }
    });
    const txtAsLines = txt.split("\n");
    if (_.isNull(out.anchorStart)) {
      return { block: "invalid link" };
    }
    const start = out.anchorStart[0] - 1;
    const end = _.isNull(out["anchorEnd"])
      ? txtAsLines.length
      : out["anchorEnd"][0];
    const block = _.trim(txtAsLines.slice(start, end).join("\n"));
    return { block, lines: { start, end } };
  }
}

export function parseDendronRef(ref: string) {
  const [idOrRef, ...rest] = _.trim(ref).split(":");
  const cleanArgs = _.trim(rest.join(":"));
  let link: DendronRefLink | undefined;
  let direction: DendronRef["direction"];
  if (idOrRef === "ref") {
    direction = "to";
    // eslint-disable-next-line no-use-before-define
    link = parseLink(cleanArgs);
  } else {
    throw Error("not implemented");
  }
  return { direction, link };
}

export function parseFileLink(ref: string): DendronRefLink {
  const wikiFileName = /([^\]:]+)/.source;
  const reLink = new RegExp(
    "" +
      /\[\[/.source +
      `(?<name>${wikiFileName})` +
      /\]\]/.source +
      `(${
        new RegExp(
          // anchor start
          "" +
            /#?/.source +
            `(?<anchorStart>${wikiFileName})` +
            // anchor stop
            `(:#(?<anchorEnd>${wikiFileName}))?`
        ).source
      })?`,
    "i"
  );
  const groups = reLink.exec(ref)?.groups;
  const clean: DendronRefLink = {
    type: "file",
  };
  _.each<Partial<DendronRefLink>>(groups, (v, k: any) => {
    if (k === "name") {
      // @ts-ignore
      clean[k] = path.basename(v as string, ".md");
    } else {
      // @ts-ignore
      clean[k] = v;
    }
  });
  return clean;
}

// export function parseIdLink(ref: string): DendronRefLink {
//     const reLink = /(?<id>[^:]+)(:([^:]+))?/;
// };

function parseLink(ref: string): DendronRefLink | undefined {
  if (ref.indexOf("]") >= 0) {
    return parseFileLink(ref);
  } else {
    throw Error("not implemented");
  }
}

// function testLineRef() {
//     const ref = "ref: b9f5caaa-288e-41e9-a2a2-21f1d8e49625";
//     return assert(parseDendronRef(ref), {
//         type: 'ref',
//         start: {id: 'b9f5caaa-288e-41e9-a2a2-21f1d8e49625'},
//     });
// };

// function testFileWithLineRef() {
//     const ref = "ref: [[foo]]#b9f5caaa-288e-41e9-a2a2-21f1d8e49625";
//     return assert(parseDendronRef(ref), {
//         type: 'ref',
//         start: {id: 'b9f5caaa-288e-41e9-a2a2-21f1d8e49625', name: 'foo'},
//     });
// };

// function testBlockRef() {
//     const ref = "ref: {[[foo.md]]#b9f5caaa-288e-41e9-a2a2-21f1d8e49625:8cf13bab-a231-40a7-9860-f52b24083873}";
//     return assert(parseDendronRef(ref), {
//         type: 'ref',
//         start: {id: 'b9f5caaa-288e-41e9-a2a2-21f1d8e49625', name: 'foo'},
//         stop: {id: '8cf13bab-a231-40a7-9860-f52b24083873'}
//     });
// };

// function runTests() {
//     console.log(testFileRef());
//     // console.log(testLineRef());
//     // console.log(testFileWithLineRef());
//     // console.log(testBlockRef());
// }

export const matchRefMarker = (txt: string) => {
  return txt.match(/\(\((?<ref>[^)]+)\)\)/);
};

export const replaceRefWithMPEImport = (
  line: string,
  opts: { root: string }
): string => {
  const ctx = "replaceRefWithMPEImport";
  L.info({ ctx, line });
  const match = matchRefMarker(line);
  let prefix = `@import`;
  if (!match || !match.groups) {
    return line;
  }
  const ref = match.groups["ref"];
  if (!ref) {
    return line;
  }
  const { link } = parseDendronRef(ref);
  // unsupported
  if (!link || !link.name) {
    return line;
  }
  const fsPath = path.join(opts.root, link.name + ".md");
  prefix += ` "${link.name + ".md"}"`;
  if (!link.anchorStart) {
    return prefix;
  }
  // {line_begin=2 line_end=10}
  const offset = [];
  //TODO: will be more sophisticated when multi-vault
  // @ts-ignore
  const { content, matter } = readMD(fsPath);
  // the last --- isn't counted, shoud be +1
  // but since mpe is 0 delimited, it cancels each other out
  const fmOffset = matter.split("\n").length;
  // @ts-ignore
  const { lines } = extractBlock(content, link);
  // TODO: throw error
  if (!lines?.start) {
    return line;
  }
  // +1 because extract block does -1 for 0-indexing file
  // +1 because header block gets parsed form line before
  const pad = 2 + fmOffset;
  offset.push(`line_begin=${lines.start + pad}`);
  if (link.anchorEnd) {
    // everything up to header is counted here
    offset.push(`line_end=${lines.end + pad - 1}`);
  }
  prefix += ` {${offset.join(" ")}}`;
  return prefix;
};

export function stripLocalOnlyTags(doc: string) {
  const re = new RegExp(/(?<raw>.+<!--LOCAL_ONLY_LINE-->)/);
  let matches;
  do {
    matches = doc.match(re);
    if (matches) {
      // @ts-ignore
      const { raw, body } = matches.groups;
      doc = doc.replace(raw, "");
    }
  } while (matches);
  return doc;
}
