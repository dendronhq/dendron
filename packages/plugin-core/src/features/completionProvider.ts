import {
  DNoteAnchor,
  ERROR_SEVERITY,
  genUUIDInsecure,
  isNotUndefined,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import {
  ALIAS_NAME,
  AnchorUtils,
  LinkUtils,
  LINK_NAME,
} from "@dendronhq/engine-server";
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

function padWithZero(n: number): string {
  if (n > 99) return String(n);
  if (n > 9) return `0${n}`;
  return `00${n}`;
}

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
  // If there's a # before the cursor, let the block autocomplete take over
  if (_.lastIndexOf(linePrefix, "#") > startIndex) {
    Logger.debug({
      ctx,
      msg: "Skipping note autocomplete to let block autocomplete take over",
      refString,
      linePrefix,
    });
    return undefined;
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
      `(?<note>${LINK_NAME})?` +
      // anchor
      `(?<hash>#+)(?<anchor>\\^)?(${LINK_NAME})?` +
    ")" +
    // May have ending brackets
    "\\]?\\]?" +
  ")",
  "g"
);

export async function provideBlockCompletionItems(
  document: TextDocument,
  position: Position,
  token?: CancellationToken
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
  if (_.isUndefined(found) || token?.isCancellationRequested) return;

  const engine = getWS().getEngine();

  let otherFile = false;
  let note: NoteProps | undefined;
  if (found.groups?.note) {
    // This anchor will be to another note, e.g. [[note#
    // `groups.note` may have vault name, so let's try to parse that
    const link = LinkUtils.parseLinkV2(found.groups.note);
    const vault = link?.vaultName
      ? VaultUtils.getVaultByName({
          vaults: engine.vaults,
          vname: link?.vaultName,
        })
      : undefined;
    // If we couldn't find the linked note, don't do anything
    if (_.isNull(link) || _.isUndefined(link.value)) return;
    note = NoteUtils.getNotesByFname({
      fname: link.value,
      vault,
      notes: engine.notes,
    })[0];
    otherFile = true;
  } else {
    // This anchor is to the same file, e.g. [[#
    note = VSCodeUtils.getNoteFromDocument(document);
  }

  if (_.isUndefined(note) || token?.isCancellationRequested) return;

  const blocks = await getWS().getEngine().getNoteBlocks({ id: note.id });
  if (
    _.isUndefined(blocks.data) ||
    blocks.error?.severity === ERROR_SEVERITY.FATAL
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
  } else if (isNotUndefined(found.groups?.hash)) {
    // When trigger by [[#, only show headers. Without this, it also shows paragraphs that include `#`
    completeableBlocks = completeableBlocks.filter(
      (block) => block.anchor?.type === "header"
    );
  }

  const completions = completeableBlocks
    .map((block, index) => {
      const edits: TextEdit[] = [];
      if (removeTrigger) edits.push(removeTrigger);
      let anchor: DNoteAnchor | undefined = block.anchor;
      if (_.isUndefined(anchor)) {
        // We can't insert edits into other files, so we can't suggest blocks without existing anchors
        if (otherFile) return;
        anchor = {
          type: "block",
          // Using the "insecure" generator avoids blocking for entropy to become available. This slightly increases the
          // chance of conflicting IDs, but that's okay since we'll only insert one of these completions. (Could also put
          // the same id for all options, but it's unclear if VSCode might reuse these completions)
          value: genUUIDInsecure(),
        };
        const blockPosition = VSCodeUtils.point2VSCodePosition(
          block.position.end
        );
        // TODO: If choosing a block that's an entire list, we need to insert the anchor 1 line after the list ("\n\n")
        edits.push(
          new TextEdit(
            new Range(blockPosition, blockPosition),
            ` ${AnchorUtils.anchor2string(anchor)}`
          )
        );
      }
      return {
        label: block.text,
        //range: new Range(),
        insertText: insertValueOnly
          ? anchor.value
          : `#${AnchorUtils.anchor2string(anchor)}`,
        // If the block didn't have an anchor, we need to insert it ourselves
        additionalTextEdits: edits,
        sortText: padWithZero(index),
      };
    })
    .filter(isNotUndefined);
  return completions;
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
      "#",
      "^"
    )
  );
};

export const completionProvider = {
  activate,
};
