import {
  DNoteAnchor,
  ERROR_SEVERITY,
  genUUID,
  isNotUndefined,
  NoteUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { ALIAS_NAME, AnchorUtils, LINK_NAME } from "@dendronhq/engine-server";
import {
  CancellationToken,
  CompletionItem,
  CompletionItemKind,
  ExtensionContext,
  languages,
  Position,
  Range,
  TextDocument,
  TextEdit,
  Uri,
  workspace,
} from "vscode";
import { Logger } from "../logger";
import { VSCodeUtils } from "../utils";
import { fsPathToRef } from "../utils/md";
import { DendronWorkspace, getWS } from "../workspace";
import path from "path";

const padWithZero = (n: number): string => (n < 10 ? "0" + n : String(n));

export const provideCompletionItems = (
  document: TextDocument,
  position: Position
) => {
  const ctx = "provideCompletionItems";
  const linePrefix = document
    .lineAt(position)
    .text.substr(0, position.character);
  Logger.debug({ ctx, linePrefix, position, msg: "enter" });

  const isResourceAutocomplete = linePrefix.match(/\!\[\[\w*$/);
  const isDocsAutocomplete = linePrefix.match(/\[\[[\w\|\.\#]*$/);

  if (!isDocsAutocomplete && !isResourceAutocomplete) {
    return undefined;
  }

  let refString = "";
  const startIndex = _.max<number>([
    _.lastIndexOf(linePrefix, "|"),
    _.lastIndexOf(linePrefix, "["),
  ]) as number;
  if (startIndex >= 0) {
    refString = linePrefix.slice(startIndex + 1, position.character);
    const endIndex = _.lastIndexOf(refString, ".");
    if (endIndex) {
      refString = refString.slice(0, endIndex + 1);
    }
  }
  Logger.debug({ ctx, refString });

  const completionItems: CompletionItem[] = [];
  const notes = DendronWorkspace.instance().getEngine().notes;
  const uris: Uri[] = _.values(notes).map((note) =>
    Uri.file(NoteUtils.getFullPath({ note, wsRoot: DendronWorkspace.wsRoot() }))
  );

  uris.forEach((uri, index) => {
    const workspaceFolder = workspace.getWorkspaceFolder(uri);

    const longRef = fsPathToRef({
      path: uri.fsPath,
      basePath: workspaceFolder?.uri.fsPath || path.dirname(uri.fsPath),
      keepExt: false, //containsImageExt(uri.fsPath) || containsOtherKnownExts(uri.fsPath),
    });

    const shortRef = fsPathToRef({
      path: uri.fsPath,
      keepExt: false, //containsImageExt(uri.fsPath) || containsOtherKnownExts(uri.fsPath),
    });

    if (!longRef || !shortRef) {
      return;
    }

    const item = new CompletionItem(longRef, CompletionItemKind.File);
    item.insertText = longRef; //insertText;

    item.sortText = padWithZero(index);

    completionItems.push(item);
  });

  return completionItems;
};

// prettier-ignore
const PARTIAL_WIKILINK_WITH_ANCHOR_REGEX = new RegExp("" +
  "(?<entireLink>" +
    // Should have the starting brackets
    "\\[\\[" +
    "(" +
      // Will then either look like [[^ or [[^anchor
      "(?<trigger>\\^\\^?)[\\w-]*" +
    "|" + // or like [[alias|note#, or [[alias|note#anchor, or [[#, or [[#anchor
      // optional alias
      "(" +
        `${ALIAS_NAME}(?=\\|)\\|` +
      ")?" +
      // optional note
      `(${LINK_NAME})?` +
      // anchor
      `#(?<anchor>\\^)?(${LINK_NAME})?` +
    ")" +
    // May have ending brackets
    "\\]?\\]?" +
  ")",
  "g"
);

export async function provideBlockCompletionItems(
  document: TextDocument,
  position: Position,
  token: CancellationToken
): Promise<CompletionItem[] | undefined> {
  let found: RegExpMatchArray | undefined;
  // This gets triggered when the user types ^, which won't necessarily happen inside a wikilink.
  // So check that the user is actually in a wikilink before we try.
  const line = document.lineAt(position.line);
  // There may be multiple wikilinks in this line
  const matches = line.text.matchAll(PARTIAL_WIKILINK_WITH_ANCHOR_REGEX);
  for (const match of matches) {
    if (_.isUndefined(match.groups) || _.isUndefined(match.index)) continue;
    const { entireLink } = match.groups;
    // If the current position is within this link, then we are trying to complete it
    if (
      match.index <= position.character &&
      position.character <= match.index + entireLink.length
    ) {
      found = match;
    }
  }
  if (_.isUndefined(found) || token.isCancellationRequested) return;

  const note = VSCodeUtils.getNoteFromDocument(document);
  if (_.isUndefined(note) || token.isCancellationRequested) return;

  const blocks = await getWS().getEngine().getNoteBlocks({ id: note.id });
  if (
    _.isUndefined(blocks.data) ||
    blocks.error?.severity === ERROR_SEVERITY.FATAL ||
    token.isCancellationRequested
  )
    return;

  // If there is [[^ or [[^^ , remove that because it's not a valid wikilink
  const removeTrigger =
    isNotUndefined(found.index) &&
    isNotUndefined(found.groups) &&
    isNotUndefined(found.groups.trigger)
      ? new TextEdit(
          new Range(
            position.line,
            found.index + 2,
            position.line,
            found.index + 2 + found.groups.trigger.length
          ),
          ""
        )
      : undefined;

  // When triggered by [[#^, only show existing block anchors
  let insertValueOnly = false;
  let completeableBlocks = blocks.data;
  if (isNotUndefined(found.groups?.anchor)) {
    completeableBlocks = completeableBlocks.filter(
      (block) => block.anchor?.type === "block"
    );
    // There is already #^ which we are not removing, so don't duplicate it when inserting the text
    insertValueOnly = true;
  }

  return completeableBlocks.map((block, index) => {
    const edits: TextEdit[] = [];
    if (removeTrigger) edits.push(removeTrigger);
    let anchor: DNoteAnchor | undefined = block.anchor;
    if (_.isUndefined(anchor)) {
      anchor = {
        type: "block",
        value: genUUID(),
      };
      const blockPosition = VSCodeUtils.point2VSCodePosition(
        block.position.end
      );
      edits.push(
        new TextEdit(
          new Range(blockPosition, blockPosition),
          ` ${AnchorUtils.anchor2string(anchor)}`
        )
      );
    }
    return {
      label: block.text,
      insertText: insertValueOnly
        ? anchor.value
        : `#${AnchorUtils.anchor2string(anchor)}`,
      // If the block didn't have an anchor, we need to insert it ourselves
      additionalTextEdits: edits,
      sortText: index.toString(),
    };
  });
}

export const activate = (context: ExtensionContext) => {
  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      "markdown",
      {
        provideCompletionItems,
      },
      "["
    )
  );
  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      "markdown",
      {
        provideCompletionItems: provideBlockCompletionItems,
      },
      "^"
    )
  );
  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      "markdown",
      {
        provideCompletionItems: provideBlockCompletionItems,
      },
      "#"
    )
  );
};

export const completionProvider = {
  activate,
};
