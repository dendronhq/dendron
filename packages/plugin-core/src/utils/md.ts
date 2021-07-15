import {
  DLink,
  DLinkType,
  DNoteAnchor,
  NoteProps,
  NoteUtils,
  TAGS_HIERARCHY,
} from "@dendronhq/common-all";
import { HASHTAG_REGEX_LOOSE, LinkUtils } from "@dendronhq/engine-server";
import { sort as sortPaths } from "cross-path-sort";
import fs from "fs";
import _ from "lodash";
import path from "path";
import vscode, {
  commands,
  extensions,
  Location,
  Position,
  Range,
  TextDocument,
} from "vscode";
import { ShowPreviewV2Command } from "../commands/ShowPreviewV2";
import { DendronWorkspace, getWS } from "../workspace";

export type RefT = {
  label: string;
  /** If undefined, then the file this reference is located in is the ref */
  ref?: string;
  anchorStart?: DNoteAnchor;
  anchorEnd?: DNoteAnchor;
  vaultName?: string;
};

export type FoundRefT = {
  location: Location;
  matchText: string;
  isCandidate?: boolean;
};

const markdownExtRegex = /\.md$/i;
export const refPattern = "(\\[\\[)([^\\[\\]]+?)(\\]\\])";
export const mdImageLinkPattern = "(\\[)([^\\[\\]]*)(\\]\\()([^\\[\\]]+?)(\\))";
const partialRefPattern = "(\\[\\[)([^\\[\\]]+)";
export const REGEX_FENCED_CODE_BLOCK =
  /^( {0,3}|\t)```[^`\r\n]*$[\w\W]+?^( {0,3}|\t)``` *$/gm;
export { sortPaths };
const REGEX_CODE_SPAN = /`[^`]*?`/gm;
// export const RE_WIKI_LINK_ALIAS = "([^\\[\\]]+?\\|)?";
// const isResourceAutocomplete = linePrefix.match(/\!\[\[\w*$/);
//   const isDocsAutocomplete = linePrefix.match(/\[\[\w*$/);
const uncPathRegex = /^[\\\/]{2,}[^\\\/]+[\\\/]+[^\\\/]+/; // eslint-disable-line no-useless-escape
export const otherExts = [
  "doc",
  "docx",
  "rtf",
  "txt",
  "odt",
  "xls",
  "xlsx",
  "ppt",
  "pptm",
  "pptx",
  "pdf",
  "pages",
  "mp4",
  "mov",
  "wmv",
  "flv",
  "avi",
  "mkv",
  "mp3",
  "webm",
  "wav",
  "m4a",
  "ogg",
  "3gp",
  "flac",
];

/** Kind-of parses a URI and extracts the scheme. Not an actual parser and will accept invalid URIs. */
export const uriRegex = /^(?<scheme>[\w+.-]+):(\/\/)?\S+/;
export const imageExts = ["png", "jpg", "jpeg", "svg", "gif", "webp"];
const imageExtsRegex = new RegExp(`.(${imageExts.join("|")})$`, "i");
export const isUncPath = (path: string): boolean => uncPathRegex.test(path);
const otherExtsRegex = new RegExp(`.(${otherExts.join("|")})$`, "i");
export const containsOtherKnownExts = (pathParam: string): boolean =>
  !!otherExtsRegex.exec(path.parse(pathParam).ext);

export class MarkdownUtils {
  static async openPreview(opts?: { reuseWindow?: boolean }) {
    const cleanOpts = _.defaults(opts, { reuseWindow: false });

    if (!getWS().config.dev?.enablePreviewV2) {
      const previewEnhanced = extensions.getExtension(
        "dendron.markdown-preview-enhanced"
      );
      const previewEnhanced2 = extensions.getExtension(
        "dendron.dendron-markdown-preview-enhanced"
      );
      const cmds = {
        builtin: {
          open: "markdown.showPreview",
          openSide: "markdown.showPreviewToSide",
        },
        enhanced: {
          open: "markdown-preview-enhanced.openPreview",
          openSide: "markdown-preview-enhanced.openPreviewToTheSide",
        },
      };
      const mdClient =
        cmds[previewEnhanced || previewEnhanced2 ? "enhanced" : "builtin"];
      const openCmd = mdClient[cleanOpts.reuseWindow ? "open" : "openSide"];
      return commands.executeCommand(openCmd);
    } else {
      new ShowPreviewV2Command().execute();
    }
  }
}

export const isInFencedCodeBlock = (
  documentOrContent: TextDocument | string,
  lineNum: number
): boolean => {
  const content =
    typeof documentOrContent === "string"
      ? documentOrContent
      : documentOrContent.getText();
  const textBefore = content
    .slice(0, positionToOffset(content, { line: lineNum, column: 0 }))
    .replace(REGEX_FENCED_CODE_BLOCK, "")
    .replace(/<!--[\W\w]+?-->/g, "");
  // So far `textBefore` should contain no valid fenced code block or comment
  return /^( {0,3}|\t)```[^`\r\n]*$[\w\W]*$/gm.test(textBefore);
};

export const positionToOffset = (
  content: string,
  position: { line: number; column: number }
) => {
  if (position.line < 0) {
    throw new Error("Illegal argument: line must be non-negative");
  }

  if (position.column < 0) {
    throw new Error("Illegal argument: column must be non-negative");
  }

  const lineBreakOffsetsByIndex = lineBreakOffsetsByLineIndex(content);
  if (lineBreakOffsetsByIndex[position.line] !== undefined) {
    return (
      (lineBreakOffsetsByIndex[position.line - 1] || 0) + position.column || 0
    );
  }

  return 0;
};

export const lineBreakOffsetsByLineIndex = (value: string): number[] => {
  const result = [];
  let index = value.indexOf("\n");

  while (index !== -1) {
    result.push(index + 1);
    index = value.indexOf("\n", index + 1);
  }

  result.push(value.length + 1);

  return result;
};

export const isInCodeSpan = (
  documentOrContent: TextDocument | string,
  lineNum: number,
  offset: number
): boolean => {
  const content =
    typeof documentOrContent === "string"
      ? documentOrContent
      : documentOrContent.getText();
  const textBefore = content
    .slice(0, positionToOffset(content, { line: lineNum, column: offset }))
    .replace(REGEX_CODE_SPAN, "")
    .trim();

  return /`[^`]*$/gm.test(textBefore);
};

export const getReferenceAtPosition = (
  document: vscode.TextDocument,
  position: vscode.Position,
  partial?: boolean
): {
  range: vscode.Range;
  ref: string;
  label: string;
  anchorStart?: DNoteAnchor;
  anchorEnd?: DNoteAnchor;
  refType?: DLinkType;
  vaultName?: string;
  /** The full text inside the ref, e.g. for [[alias|foo.bar#anchor]] this is alias|foo.bar#anchor */
  refText: string;
} | null => {
  let refType: DLinkType | undefined;
  if (
    isInFencedCodeBlock(document, position.line) ||
    isInCodeSpan(document, position.line, position.character)
  ) {
    return null;
  }

  // check if image
  const rangeForImage = document.getWordRangeAtPosition(
    position,
    new RegExp(mdImageLinkPattern)
  );
  if (rangeForImage) {
    const docText = document.getText(rangeForImage);
    const maybeImage = _.trim(docText.match("\\((.*)\\)")![0], "()");
    if (containsImageExt(maybeImage)) {
      return null;
    }
  }

  // check if hashtag
  const rangeForHashTag = document.getWordRangeAtPosition(position, HASHTAG_REGEX_LOOSE);
  if (rangeForHashTag) {
    const docText = document.getText(rangeForHashTag);
    const match = docText.match(HASHTAG_REGEX_LOOSE);
    if (_.isNull(match)) return null;
    return {
      range: rangeForHashTag,
      label: match[0],
      ref: `${TAGS_HIERARCHY}${match[1]}`,
      refText: docText,
    }
  }

  // otherwise, this has to be a wikilink or hashtag
  const re = partial ? partialRefPattern : refPattern;
  const range = document.getWordRangeAtPosition(position, new RegExp(re));
  if (!range) {
    // it's not a reference or hashtag either, we don't know what this is
    return null;
  }

  const docText = document.getText(range);
  const refText = docText
    .replace("![[", "")
    .replace("[[", "")
    .replace("]]", "");

  // don't incldue surrounding fluff for definition
  const { ref, label, anchorStart, anchorEnd, vaultName } = parseRef(refText);

  const startChar = range.start.character;
  // because
  const prefixRange = new Range(
    new Position(range.start.line, Math.max(0, startChar - 1)),
    new Position(range.start.line, startChar + 2)
  );
  if (document.getText(prefixRange).indexOf("![[") >= 0) {
    refType = "refv2";
  }

  return {
    // If ref is missing, it's implicitly the current file
    ref: ref || NoteUtils.uri2Fname(document.uri),
    label,
    range,
    anchorStart,
    anchorEnd,
    refType,
    vaultName,
    refText,
  };
};

export const parseRef = (rawRef: string): RefT => {
  const parsed = LinkUtils.parseNoteRef(rawRef);
  if (_.isNull(parsed)) throw new Error(`Unable to parse reference ${rawRef}`);
  const { fname, alias } = parsed.from;
  const { anchorStart, anchorEnd, vaultName } = parsed.data;

  return {
    label: alias || "",
    ref: fname,
    anchorStart: parseAnchor(anchorStart),
    anchorEnd: parseAnchor(anchorEnd),
    vaultName,
  };
};

export const parseAnchor = (anchorValue?: string): DNoteAnchor | undefined => {
  // If undefined or empty string
  if (!anchorValue) return undefined;

  if (anchorValue[0] === "^") {
    return { type: "block", value: anchorValue.slice(1) };
  } else {
    return { type: "header", value: anchorValue };
  }
};

export const containsUnknownExt = (pathParam: string): boolean =>
  path.parse(pathParam).ext !== "" &&
  !containsMarkdownExt(pathParam) &&
  !containsImageExt(pathParam) &&
  !containsOtherKnownExts(pathParam);

export const isLongRef = (path: string) => path.split("/").length > 1;

export const containsNonMdExt = (ref: string) => {
  return (
    containsImageExt(ref) ||
    containsOtherKnownExts(ref) ||
    containsUnknownExt(ref)
  );
};

export const noteLinks2Locations = (note: NoteProps) => {
  const refs: {
    location: Location;
    matchText: string;
    link: DLink;
  }[] = [];
  const linksMatch = note.links.filter((l) => l.type !== "backlink");
  const fsPath = NoteUtils.getFullPath({
    note,
    wsRoot: DendronWorkspace.wsRoot(),
  });
  const fileContent = fs.readFileSync(fsPath).toString();
  const fmOffset = fileContent.indexOf("\n---") + 4;
  linksMatch.forEach((link) => {
    const { start } = link.position;
    const lines = fileContent.slice(0, fmOffset + start.offset!).split("\n");
    const lineNum = lines.length;

    refs.push({
      location: new vscode.Location(
        vscode.Uri.file(fsPath),
        new vscode.Range(
          new vscode.Position(lineNum, 0),
          new vscode.Position(lineNum + 1, 0)
        )
      ),
      matchText: lines.slice(-1)[0],
      link,
    });
  });
  return refs;
};

export const findReferences = async (
  ref: string,
  excludePaths: string[] = []
): Promise<FoundRefT[]> => {
  const refs: FoundRefT[] = [];

  const engine = DendronWorkspace.instance().getEngine();
  // clean for anchor
  const fname = ref;
  const notes = NoteUtils.getNotesByFname({ fname, notes: engine.notes });
  const notesWithRefs = await Promise.all(
    notes.flatMap((note) => {
      return NoteUtils.getNotesWithLinkTo({
        note,
        notes: engine.notes,
      });
    })
  );

  _.forEach(notesWithRefs, (note) => {
    const linksMatch = note.links.filter((l) => l.to?.fname === fname);
    const fsPath = NoteUtils.getFullPath({
      note,
      wsRoot: DendronWorkspace.wsRoot(),
    });

    if (excludePaths.includes(fsPath) || !fs.existsSync(fsPath)) {
      return;
    }
    const fileContent = fs.readFileSync(fsPath).toString();
    // we are assuming there won't be a `\n---\n` key inside the frontmatter
    const fmOffset = fileContent.indexOf("\n---") + 4;
    linksMatch.forEach((link) => {
      const { end } = link.position;
      const lines = fileContent
        .slice(0, fmOffset + end.offset! + 1)
        .split("\n");
      const lineNum = lines.length;
      const range =
        link.type === "wiki"
          ? new vscode.Range(
              new vscode.Position(lineNum - 1, 0),
              new vscode.Position(lineNum, 0)
            )
          : new vscode.Range(
              new vscode.Position(lineNum - 1, link.position.start.column - 1),
              new vscode.Position(lineNum - 1, link.position.end.column - 1)
            );
      const location = new vscode.Location(vscode.Uri.file(fsPath), range);
      const foundRef: FoundRefT = {
        location,
        matchText: lines.slice(-1)[0],
      };
      if (link.type === "linkCandidate") {
        foundRef.isCandidate = true;
      }

      refs.push(foundRef);
    });
  });

  return refs;
};

export const containsMarkdownExt = (pathParam: string): boolean =>
  !!markdownExtRegex.exec(path.parse(pathParam).ext);

export const trimLeadingSlash = (value: string) =>
  value.replace(/^\/+|^\\+/g, "");
export const trimTrailingSlash = (value: string) =>
  value.replace(/\/+$|\\+$/g, "");
export const trimSlashes = (value: string) =>
  trimLeadingSlash(trimTrailingSlash(value));
export const normalizeSlashes = (value: string) => value.replace(/\\/gi, "/");

export const fsPathToRef = ({
  path: fsPath,
  keepExt,
  basePath,
}: {
  path: string;
  keepExt?: boolean;
  basePath?: string;
}): string | null => {
  const ref =
    basePath && fsPath.startsWith(basePath)
      ? normalizeSlashes(fsPath.replace(basePath, ""))
      : path.basename(fsPath);

  if (keepExt) {
    return trimLeadingSlash(ref);
  }

  return trimLeadingSlash(
    ref.includes(".") ? ref.slice(0, ref.lastIndexOf(".")) : ref
  );
};

export const containsImageExt = (pathParam: string): boolean =>
  !!imageExtsRegex.exec(path.parse(pathParam).ext);

/** Returns true if this is a non-dendron uri, false if it is dendron://, undefined if it's not a URI */
export const containsNonDendronUri = (uri: string): boolean | undefined => {
  const groups = uriRegex.exec(uri)?.groups;
  if (_.isUndefined(groups) || _.isUndefined(groups.scheme)) return undefined;
  if (groups.scheme === "dendron") return false;
  return true;
};
