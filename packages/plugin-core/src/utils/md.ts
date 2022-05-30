import {
  ConfigUtils,
  DLink,
  DLinkType,
  DNoteAnchorBasic,
  DVault,
  isBlockAnchor,
  isLineAnchor,
  NoteProps,
  NoteUtils,
  TAGS_HIERARCHY,
  USERS_HIERARCHY,
} from "@dendronhq/common-all";
import {
  HASHTAG_REGEX_BASIC,
  HASHTAG_REGEX_LOOSE,
  LinkUtils,
  RemarkUtils,
  USERTAG_REGEX_LOOSE,
  WorkspaceUtils,
} from "@dendronhq/engine-server";
import { sort as sortPaths } from "cross-path-sort";
import fs from "fs";
import _ from "lodash";
import path from "path";
import vscode, {
  commands,
  extensions,
  Location,
  MarkdownString,
  Position,
  Range,
  Selection,
  TextDocument,
} from "vscode";
import { ExtensionProvider } from "../ExtensionProvider";
import { VSCodeUtils } from "../vsCodeUtils";

export type RefT = {
  label: string;
  /** If undefined, then the file this reference is located in is the ref */
  ref?: string;
  anchorStart?: DNoteAnchorBasic;
  anchorEnd?: DNoteAnchorBasic;
  vaultName?: string;
};

export type FoundRefT = {
  location: Location;
  matchText: string;
  isCandidate?: boolean;
  note?: NoteProps;
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

export const imageExts = ["png", "jpg", "jpeg", "svg", "gif", "webp"];
const imageExtsRegex = new RegExp(`[.](${imageExts.join("|")})$`, "i");
export const isUncPath = (path: string): boolean => uncPathRegex.test(path);
const otherExtsRegex = new RegExp(`[.](${otherExts.join("|")})$`, "i");
export const containsOtherKnownExts = (pathParam: string): boolean =>
  !!otherExtsRegex.exec(path.parse(pathParam).ext);

export class MarkdownUtils {
  static hasLegacyPreview() {
    return !_.isUndefined(
      extensions.getExtension("dendron.dendron-markdown-preview-enhanced")
    );
  }

  static showLegacyPreview() {
    return commands.executeCommand("markdown-preview-enhanced.openPreview");
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

export const getURLAt = (editor: vscode.TextEditor | undefined): string => {
  if (editor) {
    const docText = editor.document.getText();
    const offsetStart = editor.document.offsetAt(editor.selection.start);
    const offsetEnd = editor.document.offsetAt(editor.selection.end);
    const selectedText = docText.substring(offsetStart, offsetEnd);
    const selectUri = true;
    const validUriChars = "A-Za-z0-9-._~:/?#@!$&'*+,;%=\\\\";
    const invalidUriChars = ["[^", validUriChars, "]"].join("");
    const regex = new RegExp(invalidUriChars);

    if (selectedText !== "" && regex.test(selectedText)) {
      return "";
    }

    const leftSplit = docText.substring(0, offsetStart).split(regex);
    const leftText = leftSplit[leftSplit.length - 1];
    const selectStart = offsetStart - leftText.length;

    const rightSplit = docText.substring(offsetEnd, docText.length);
    const rightText = rightSplit.substring(0, regex.exec(rightSplit)?.index);
    const selectEnd = offsetEnd + rightText.length;

    if (selectEnd && selectStart) {
      if (
        selectStart >= 0 &&
        selectStart < selectEnd &&
        selectEnd <= docText.length
      ) {
        if (selectUri) {
          editor.selection = new Selection(
            editor.document.positionAt(selectStart),
            editor.document.positionAt(selectEnd)
          );
          editor.revealRange(editor.selection);
        }
        return [leftText, selectedText, rightText].join("");
      }
    }
  }
  return "";
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

export type getReferenceAtPositionResp = {
  range: vscode.Range;
  ref: string;
  label: string;
  anchorStart?: DNoteAnchorBasic;
  anchorEnd?: DNoteAnchorBasic;
  refType?: DLinkType;
  vaultName?: string;
  /** The full text inside the ref, e.g. for [[alias|foo.bar#anchor]] this is alias|foo.bar#anchor */
  refText: string;
};

export async function getReferenceAtPosition({
  document,
  position,
  wsRoot,
  vaults,
  opts,
}: {
  document: vscode.TextDocument;
  position: vscode.Position;
  wsRoot: string;
  vaults: DVault[];
  opts?: {
    partial?: boolean;
    allowInCodeBlocks: boolean;
  };
}): Promise<getReferenceAtPositionResp | null> {
  let refType: DLinkType | undefined;
  if (
    opts?.allowInCodeBlocks !== true &&
    (isInFencedCodeBlock(document, position.line) ||
      isInCodeSpan(document, position.line, position.character))
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

  // this should be a wikilink or reference
  const re = opts?.partial ? partialRefPattern : refPattern;
  const rangeWithLink = document.getWordRangeAtPosition(
    position,
    new RegExp(re)
  );

  // didn't find a ref
  // check if it is a user tag, a regular tag, or a frontmatter tag
  if (!rangeWithLink) {
    const { enableUserTags, enableHashTags } = ConfigUtils.getWorkspace(
      ExtensionProvider.getDWorkspace().config
    );
    if (enableHashTags) {
      // if not, it could be a hashtag
      const rangeForHashTag = document.getWordRangeAtPosition(
        position,
        HASHTAG_REGEX_BASIC
      );
      if (rangeForHashTag) {
        const docText = document.getText(rangeForHashTag);
        const match = docText.match(HASHTAG_REGEX_LOOSE);
        if (_.isNull(match)) return null;
        return {
          range: rangeForHashTag,
          label: match[0],
          ref: `${TAGS_HIERARCHY}${match.groups!.tagContents}`,
          refText: docText,
          refType: "hashtag",
        };
      }
    }
    if (enableUserTags) {
      // if not, it could be a user tag
      const rangeForUserTag = document.getWordRangeAtPosition(
        position,
        USERTAG_REGEX_LOOSE
      );
      if (rangeForUserTag) {
        const docText = document.getText(rangeForUserTag);
        const match = docText.match(USERTAG_REGEX_LOOSE);
        if (_.isNull(match)) return null;
        return {
          range: rangeForUserTag,
          label: match[0],
          ref: `${USERS_HIERARCHY}${match.groups!.userTagContents}`,
          refText: docText,
          refType: "usertag",
        };
      }
    }
    // if not, it could be a frontmatter tag
    // only parse if this is a dendron note
    if (
      !(await WorkspaceUtils.isDendronNote({
        wsRoot,
        vaults,
        fpath: document.uri.fsPath,
      }))
    ) {
      return null;
    }
    const maybeTags = RemarkUtils.extractFMTags(document.getText());
    if (!_.isEmpty(maybeTags)) {
      for (const tag of maybeTags) {
        // Offset 1 for the starting `---` line of frontmatter
        const tagPos = VSCodeUtils.position2VSCodeRange(tag.position, {
          line: 1,
        });
        if (
          tagPos.start.line <= position.line &&
          position.line <= tagPos.end.line &&
          tagPos.start.character <= position.character &&
          position.character <= tagPos.end.character
        ) {
          tag.value = _.trim(tag.value);
          return {
            range: tagPos,
            label: tag.value,
            ref: `${TAGS_HIERARCHY}${tag.value}`,
            refText: tag.value,
            refType: "fmtag",
          };
        }
      }
    }

    // it's not a wikilink, reference, or a hashtag. Nothing to do here.
    return null;
  }

  const docText = document.getText(rangeWithLink);
  const refText = docText
    .replace("![[", "")
    .replace("[[", "")
    .replace("]]", "");

  // don't incldue surrounding fluff for definition
  const { ref, label, anchorStart, anchorEnd, vaultName } = parseRef(refText);

  const startChar = rangeWithLink.start.character;
  // because
  const prefixRange = new Range(
    new Position(rangeWithLink.start.line, Math.max(0, startChar - 1)),
    new Position(rangeWithLink.start.line, startChar + 2)
  );
  const prefix = document.getText(prefixRange);
  if (prefix.indexOf("![[") >= 0) {
    refType = "refv2";
  } else if (prefix.indexOf("[[") >= 0) {
    refType = "wiki";
  }

  return {
    // If ref is missing, it's implicitly the current file
    ref: ref || NoteUtils.uri2Fname(document.uri),
    label,
    range: rangeWithLink,
    anchorStart,
    anchorEnd,
    refType,
    vaultName,
    refText,
  };
}

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

export const parseAnchor = (
  anchorValue?: string
): DNoteAnchorBasic | undefined => {
  // If undefined or empty string
  if (!anchorValue) return undefined;

  if (isBlockAnchor(anchorValue)) {
    return { type: "block", value: anchorValue.slice(1) };
  } else if (isLineAnchor(anchorValue)) {
    const value = anchorValue.slice(1);
    return {
      type: "line",
      value,
      line: _.toInteger(value),
    };
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
    wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
  });
  const fileContent = fs.readFileSync(fsPath).toString();
  const fmOffset = fileContent.indexOf("\n---") + 4;
  linksMatch.forEach((link) => {
    const startOffset = link.position?.start.offset || 0;
    const lines = fileContent.slice(0, fmOffset + startOffset).split("\n");
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

export async function findReferencesById(id: string) {
  const refs: FoundRefT[] = [];

  const engine = ExtensionProvider.getEngine();

  const note = engine.notes[id];

  if (!note) {
    return;
  }

  const notesWithRefs = NoteUtils.getNotesWithLinkTo({
    note,
    notes: engine.notes,
  });

  _.forEach(notesWithRefs, (noteWithRef) => {
    const linksMatch = noteWithRef.links.filter(
      (l) => l.to?.fname?.toLowerCase() === note.fname.toLowerCase()
    );
    const fsPath = NoteUtils.getFullPath({
      note: noteWithRef,
      wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
    });

    if (!fs.existsSync(fsPath)) {
      return;
    }
    const fileContent = fs.readFileSync(fsPath).toString();
    // we are assuming there won't be a `\n---\n` key inside the frontmatter
    const fmOffset = fileContent.indexOf("\n---") + 4;
    linksMatch.forEach((link) => {
      const endOffset = link.position?.end.offset || 0;
      const lines = fileContent.slice(0, fmOffset + endOffset + 1).split("\n");
      const lineNum = lines.length;
      let range: vscode.Range;
      switch (link.type) {
        case "wiki":
          range = new vscode.Range(
            new vscode.Position(
              lineNum - 1,
              (link.position?.start.column || 1) - 1
            ),
            new vscode.Position(lineNum - 1, link.position?.end.column || 1)
          );
          break;
        case "frontmatterTag":
          // -2 in lineNum so that it targets the end of the frontmatter
          range = new vscode.Range(
            new vscode.Position(
              lineNum - 2,
              (link.position?.start.column || 1) - 1
            ),
            new vscode.Position(
              lineNum - 2,
              (link.position?.end.column || 1) - 1
            )
          );
          break;
        default:
          range = new vscode.Range(
            new vscode.Position(
              lineNum - 1,
              (link.position?.start.column || 1) - 1
            ),
            new vscode.Position(
              lineNum - 1,
              (link.position?.end.column || 1) - 1
            )
          );
      }
      const location = new vscode.Location(vscode.Uri.file(fsPath), range);
      const foundRef: FoundRefT = {
        location,
        matchText: lines.slice(-1)[0],
        note: noteWithRef,
      };
      if (link.type === "linkCandidate") {
        foundRef.isCandidate = true;
      }

      refs.push(foundRef);
    });
  });

  return refs;
}

/**
 *  ^find-references
 * @param fname
 * @param excludePaths
 * @returns
 */
export const findReferences = async (
  fname: string,
  excludePaths: string[] = []
): Promise<FoundRefT[]> => {
  const refs: FoundRefT[] = [];

  const engine = ExtensionProvider.getEngine();
  // clean for anchor
  const notes = NoteUtils.getNotesByFnameFromEngine({
    fname,
    engine,
  });

  const notesWithRefs = await Promise.all(
    notes.flatMap((note) => {
      return NoteUtils.getNotesWithLinkTo({
        note,
        notes: engine.notes,
      });
    })
  );

  _.forEach(notesWithRefs, (note) => {
    const linksMatch = note.links.filter(
      (l) => l.to?.fname?.toLowerCase() === fname.toLowerCase()
    );
    const fsPath = NoteUtils.getFullPath({
      note,
      wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
    });

    if (excludePaths.includes(fsPath) || !fs.existsSync(fsPath)) {
      return;
    }
    const fileContent = fs.readFileSync(fsPath).toString();
    // we are assuming there won't be a `\n---\n` key inside the frontmatter
    const fmOffset = fileContent.indexOf("\n---") + 4;
    linksMatch.forEach((link) => {
      const endOffset = link.position?.end.offset || 0;
      const lines = fileContent.slice(0, fmOffset + endOffset + 1).split("\n");
      const lineNum = lines.length;
      let range: vscode.Range;
      switch (link.type) {
        case "wiki":
          range = new vscode.Range(
            new vscode.Position(
              lineNum - 1,
              (link.position?.start.column || 1) - 1
            ),
            new vscode.Position(lineNum - 1, link.position?.end.column || 1)
          );
          break;
        case "frontmatterTag":
          // -2 in lineNum so that it targets the end of the frontmatter
          range = new vscode.Range(
            new vscode.Position(
              lineNum - 2,
              (link.position?.start.column || 1) - 1
            ),
            new vscode.Position(
              lineNum - 2,
              (link.position?.end.column || 1) - 1
            )
          );
          break;
        default:
          range = new vscode.Range(
            new vscode.Position(
              lineNum - 1,
              (link.position?.start.column || 1) - 1
            ),
            new vscode.Position(
              lineNum - 1,
              (link.position?.end.column || 1) - 1
            )
          );
      }
      const location = new vscode.Location(vscode.Uri.file(fsPath), range);
      const foundRef: FoundRefT = {
        location,
        matchText: lines.slice(-1)[0],
        note,
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

export function getSurroundingContextForNoteRefMds(
  ref: FoundRefT,
  linesOfContext: number
): string {
  const note = ref.note!;

  const fsPath = NoteUtils.getFullPath({
    note,
    wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
  });
  const fileContent = fs.readFileSync(fsPath).toString();

  const lines = fileContent.split("\n");

  const frontmatterOffset = lines.indexOf("---", 1);

  const linkLineNumber = ref.location.range.start.line;

  console.log("-- BEGIN --");
  console.log(`Match Text:${ref.matchText} | Line Number: ${linkLineNumber}`);
  const unformatted = lines[linkLineNumber];
  console.log(unformatted);
  const prefix = unformatted.substring(0, ref.location.range.start.character);
  console.log(prefix);
  const suffix = unformatted.substring(
    ref.location.range.end.character,
    unformatted.length
  );
  const middle = unformatted.substring(
    ref.location.range.start.character,
    ref.location.range.end.character
  );
  console.log(suffix);
  console.log("-- END --");

  const golden = `${prefix}<span style="color:#000;background-color:#FFFF00;">${middle}</span>${suffix}`;

  // lower and upper here refer to the line numbers in a text document (so
  // 'lower' elements appears at the top of your screen)
  const lowerBound = Math.max(
    0,
    frontmatterOffset + 1,
    linkLineNumber - linesOfContext
  );

  const lowerBoundText =
    lowerBound <= frontmatterOffset + 1
      ? "--- _Start of Note_ ---<br/>"
      : `--- _line ${lowerBound}_ ---<br/>`;

  const upperBound = Math.min(
    lines.length - 1,
    ref.location.range.start.line + linesOfContext + 1
  );

  const upperBoundText =
    upperBound === lines.length - 1
      ? "<br/>--- _End of Note_ ---"
      : `<br/>--- _line ${upperBound}_ ---`;

  const lowerContentBlock = lines.slice(lowerBound, linkLineNumber);
  const upperContentBlock = lines.slice(linkLineNumber + 1, upperBound);

  if (lowerContentBlock.length === 0) {
    lowerContentBlock.push("\n");
  }

  if (upperContentBlock.length === 0) {
    upperContentBlock.push("\n");
  }

  adjustForCodeBlocks(lowerContentBlock);

  const codeBlockSections = _.filter(upperContentBlock, (text) =>
    text.startsWith("```")
  ).length;

  if (codeBlockSections % 2 === 1) {
    upperContentBlock.push("```");
  }

  if (
    upperContentBlock.slice(-1)[0].startsWith("- ") ||
    upperContentBlock.slice(-1)[0].startsWith("* ")
  ) {
    upperContentBlock.push("\n");
  }

  //   const rawTextFormattedStyle = new MarkdownString(`${lowerBoundText}
  // <pre>
  // ${lines.slice(lowerBound, linkLineNumber).join("\n")}
  // <span style="color:#000;background-color:#FFFF00;">${
  //     lines[linkLineNumber]
  //   }</span>
  // ${lines.slice(linkLineNumber + 1, upperBound).join("\n")}
  // </pre>
  // ${upperBoundText}
  // `);

  // TODO: Add logic to make it still render ok if we're in the middle of a code block
  // const markdownStyle = new MarkdownString();
  // markdownStyle.appendMarkdown(
  //   lowerBoundText +
  //     "\n" +
  //     lines.slice(lowerBound, linkLineNumber).join("\n") +
  //     `\n<span style="color:#000;background-color:#FFFF00;">${lines[linkLineNumber]}</span>` +
  //     lines.slice(linkLineNumber + 1, upperBound).join("\n") +
  //     "\n" +
  //     upperBoundText
  // );

  // return markdownStyle;
  // return rawTextFormattedStyle;

  const finalArray = [];

  finalArray.push(lowerBoundText);
  // finalArray.push(...lines.slice(lowerBound, linkLineNumber));
  finalArray.push(...lowerContentBlock);
  finalArray.push(golden);
  // finalArray.push(
  //   `<span style="color:#000;background-color:#FFFF00;">${lines[linkLineNumber]}</span>`
  // );
  finalArray.push(...upperContentBlock);
  finalArray.push(upperBoundText);

  return finalArray.join("\n");

  // return (
  //   lowerBoundText +
  //   "\n" +
  //   lines.slice(lowerBound, linkLineNumber).join("\n") +
  //   `\n<span style="color:#000;background-color:#FFFF00;">${lines[linkLineNumber]}</span>` +
  //   lines.slice(linkLineNumber + 1, upperBound).join("\n") +
  //   "\n" +
  //   upperBoundText
  // );
}

function adjustForCodeBlocks(input: string[]): void {
  const codeBlockSections = _.filter(input, (text) =>
    text.startsWith("```")
  ).length;

  if (codeBlockSections % 2 === 1) {
    input.unshift("```");
  }
}
