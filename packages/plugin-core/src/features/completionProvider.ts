import {
  ALIAS_NAME,
  DefaultMap,
  DNoteAnchor,
  ERROR_SEVERITY,
  genUUIDInsecure,
  isNotUndefined,
  LINK_NAME,
  NoteProps,
  NoteUtils,
  TAGS_HIERARCHY,
  USERS_HIERARCHY,
  VaultUtils,
} from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import {
  AnchorUtils,
  DendronASTDest,
  DendronASTTypes,
  HASHTAG_REGEX_LOOSE,
  LinkUtils,
  MDUtilsV5,
  ProcFlavor,
  USERTAG_REGEX_LOOSE,
} from "@dendronhq/engine-server";
import _ from "lodash";
import {
  CancellationToken,
  CompletionItem,
  CompletionItemKind,
  ExtensionContext,
  languages,
  MarkdownString,
  Position,
  Range,
  TextDocument,
  TextEdit,
} from "vscode";
import { Logger } from "../logger";
import { VSCodeUtils } from "../utils";
import { sentryReportingCallback } from "../utils/analytics";
import { DendronExtension, getDWorkspace, getExtension } from "../workspace";

function padWithZero(n: number): string {
  if (n > 99) return String(n);
  if (n > 9) return `0${n}`;
  return `00${n}`;
}

// prettier-ignore
const NOTE_AUTOCOMPLETEABLE_REGEX = new RegExp("" +
  "(?<entireLink>" +
    // This may be a wikilink or reference
    "(?<beforeAnchor>" +
      "(?<beforeNote>" +
        // Should have the starting brackets
        "(?<reference>!)?\\[\\[" +
        // optional alias
        `(${ALIAS_NAME}(?=\\|)\\|)?` +
      ")" +
      // note name
      `(?<note>${LINK_NAME})?` +
    ")" +
    "(?<afterNote>" +
      // anchor
      "(?<hash>#+)(?<anchor>\\^)?" +
      // text of the header or anchor
      "[^\\[\\]]" +
    ")?" +
    // May have ending brackets
    "\\]?\\]?" +
    "|" + // or it may be a hashtag (potentially a hashtag that's empty)
    HASHTAG_REGEX_LOOSE.source + "?" +
    "|" + // or it may be a user tag
    USERTAG_REGEX_LOOSE.source + "?" +
  ")",
  "g"
);

export const provideCompletionItems = sentryReportingCallback(
  (document: TextDocument, position: Position) => {
    const ctx = "provideCompletionItems";

    // No-op if we're not in a Dendron Workspace
    if (!DendronExtension.isActive()) {
      return;
    }

    const line = document.lineAt(position).text;
    Logger.debug({ ctx, position, msg: "enter" });

    let found: RegExpMatchArray | undefined;
    const matches = line.matchAll(NOTE_AUTOCOMPLETEABLE_REGEX);
    for (const match of matches) {
      if (_.isUndefined(match.groups) || _.isUndefined(match.index)) continue;
      const { entireLink } = match.groups;
      if (
        match.index <= position.character &&
        position.character <= match.index + entireLink.length
      ) {
        found = match;
      }
    }
    if (
      _.isUndefined(found) ||
      _.isUndefined(found.index) ||
      _.isUndefined(found.groups)
    )
      return;
    Logger.debug({ ctx, found });

    if (
      found.groups.hash &&
      found.index + (found.groups.beforeAnchor?.length || 0) >
        position.character
    ) {
      Logger.info({ ctx, msg: "letting block autocomplete take over" });
      return;
    }

    let start: number;
    let end: number;
    if (found.groups.hashTag || found.groups.userTag) {
      // This is a hashtag or user tag
      start = found.index + 1 /* for the # or @ symbol */;
      end =
        start +
        (found.groups.tagContents?.length ||
          found.groups.userTagContents?.length ||
          0);
    } else {
      // This is a wikilink or a reference
      start = found.index + (found.groups.beforeNote?.length || 0);
      end = start + (found.groups.note?.length || 0);
    }
    const range = new Range(position.line, start, position.line, end);

    const { engine } = getDWorkspace();
    const notes = engine.notes;
    const completionItems: CompletionItem[] = [];
    const currentVault = VSCodeUtils.getNoteFromDocument(document)?.vault;
    const wsRoot = engine.wsRoot;
    Logger.debug({
      ctx,
      range,
      notesLength: notes.length,
      currentVault,
      wsRoot,
    });

    const notesByFname = new DefaultMap<string, number>(() => 0);
    _.values(notes).forEach((note) => {
      notesByFname.set(note.fname, notesByFname.get(note.fname) + 1);
    });

    _.values(notes).map((note, index) => {
      const item: CompletionItem = {
        label: note.fname,
        insertText: note.fname,
        kind: CompletionItemKind.File,
        sortText: padWithZero(index),
        detail: VaultUtils.getName(note.vault),
        range,
      };

      if (found?.groups?.hashTag) {
        // We are completing a hashtag, so only do completion for tag notes.
        if (!note.fname.startsWith(TAGS_HIERARCHY)) return;
        // Since this is a hashtag, `tags.foo` becomes `#foo`.
        item.label = `${note.fname.slice(TAGS_HIERARCHY.length)}`;
        item.insertText = item.label;
        // hashtags don't support xvault links, so we skip any special xvault handling
      } else if (found?.groups?.userTag) {
        // We are completing a user tag, so only do completion for user notes.
        if (!note.fname.startsWith(USERS_HIERARCHY)) return;
        // Since this is a hashtag, `tags.foo` becomes `#foo`.
        item.label = `${note.fname.slice(USERS_HIERARCHY.length)}`;
        item.insertText = item.label;
        // user tags don't support xvault links, so we skip any special xvault handling
      } else if (
        currentVault &&
        !VaultUtils.isEqual(currentVault, note.vault, wsRoot)
      ) {
        // For notes from other vaults than the current note, sort them after notes from the current vault.
        // x will get sorted after numbers, so these will appear after notes without x
        item.sortText = "x" + item.sortText;

        const sameNameNotes = notesByFname.get(note.fname);
        if (sameNameNotes > 1) {
          // There are multiple notes with the same name in multiple vaults,
          // and this note is in a different vault than the current note.
          // To generate a link to this note, we have to do an xvault link.
          item.insertText = `${VaultUtils.toURIPrefix(note.vault)}/${
            note.fname
          }`;
        }
      }

      completionItems.push(item);
    });
    Logger.info({ ctx, completionItemsLength: completionItems.length });
    return completionItems;
  }
);

export const resolveCompletionItem = sentryReportingCallback(
  async (
    item: CompletionItem,
    token: CancellationToken
  ): Promise<CompletionItem | undefined> => {
    const ctx = "resolveCompletionItem";
    const { label: fname, detail: vname } = item;
    if (
      !_.isString(fname) ||
      !_.isString(vname) ||
      token.isCancellationRequested
    )
      return;

    const engine = getDWorkspace().engine;
    const { vaults, notes, wsRoot } = engine;
    const vault = VaultUtils.getVaultByName({ vname, vaults });
    if (_.isUndefined(vault)) {
      Logger.info({ ctx, msg: "vault not found", fname, vault, wsRoot });
      return;
    }
    const note = NoteUtils.getNoteByFnameV5({
      fname,
      vault,
      notes,
      wsRoot,
    });
    if (_.isUndefined(note)) {
      Logger.info({ ctx, msg: "note not found", fname, vault, wsRoot });
      return;
    }

    try {
      // Render a preview of this note
      const proc = MDUtilsV5.procRemarkFull(
        {
          dest: DendronASTDest.MD_REGULAR,
          engine,
          vault: note.vault,
          fname: note.fname,
        },
        {
          flavor: ProcFlavor.HOVER_PREVIEW,
        }
      );
      const rendered = await proc.process(
        `![[${VaultUtils.toURIPrefix(note.vault)}/${note.fname}]]`
      );
      if (token.isCancellationRequested) return;
      item.documentation = new MarkdownString(rendered.toString());
      Logger.debug({ ctx, msg: "rendered note" });
    } catch (err) {
      // Failed creating preview of the note
      Logger.info({ ctx, err, msg: "failed to render note" });
      return;
    }

    return item;
  }
);

// prettier-ignore
const PARTIAL_WIKILINK_WITH_ANCHOR_REGEX = new RegExp("" +
  "(?<entireLink>" +
    // Should have the starting brackets
    "\\[\\[" +
    "(" +
      // Will then either look like [[^ or [[^anchor
      "(?<trigger>\\^)(?<afterTrigger>[\\w-]*)" +
    "|" + // or like [[alias|note#, or [[alias|note#anchor, or [[#, or [[#anchor
      "(?<beforeAnchor>" +
        // optional alias
        `(${ALIAS_NAME}(?=\\|)\\|)?` +
        // optional note
        `(?<note>${LINK_NAME})?` +
        // anchor
        "(?<hash>#+)(?<anchor>\\^)?" +
      ")" +
      // the text user typed to select the block
      `(?<afterAnchor>${LINK_NAME})?` +
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
  const ctx = "provideBlockCompletionItems";

  // No-op if we're not in a Dendron Workspace
  if (!DendronExtension.isActive()) {
    return;
  }

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
  if (
    _.isUndefined(found) ||
    _.isUndefined(found.index) ||
    _.isUndefined(found.groups) ||
    token?.isCancellationRequested
  )
    return;
  Logger.debug({ ctx, found });

  const timestampStart = process.hrtime();
  const engine = getDWorkspace().engine;

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
  Logger.debug({ ctx, fname: note.fname });

  // If there is [[^ or [[^^ , remove that because it's not a valid wikilink
  const removeTrigger = isNotUndefined(found.groups.trigger)
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

  let filterByAnchorType: "header" | "block" | undefined;
  // When triggered by [[#^, only show existing block anchors
  let insertValueOnly = false;
  if (isNotUndefined(found.groups?.anchor)) {
    filterByAnchorType = "block";
    // There is already #^ which we are not removing, so don't duplicate it when inserting the text
    insertValueOnly = true;
  } else if (isNotUndefined(found.groups?.hash)) {
    filterByAnchorType = "header";
    // There is already # which we are not removing, so don't duplicate it when inserting the text
    insertValueOnly = true;
  }

  const blocks = await getExtension()
    .getEngine()
    .getNoteBlocks({ id: note.id, filterByAnchorType });
  if (
    _.isUndefined(blocks.data) ||
    blocks.error?.severity === ERROR_SEVERITY.FATAL
  ) {
    Logger.error({
      ctx,
      error: blocks.error || undefined,
      msg: `Unable to get blocks for autocomplete`,
    });
    return;
  }
  Logger.debug({ ctx, blockCount: blocks.data.length });

  // Calculate the replacement range. This must contain any text the user has typed for the block, but not the trigger symbols (#, ^, #^)
  // This is used to determine what the user has typed to narrow the options, and also to pick what will get replaced once the completion is picked.
  let start = found.index + 2; /* length of [[ */
  let end = start;
  if (found.groups.trigger) {
    // Skip the trigger ^
    start += found.groups.trigger.length;
    // Include the text user has typed after trigger
    end = start;
    if (found.groups.afterTrigger) end += found.groups.afterTrigger.length;
  }
  if (found.groups.beforeAnchor) {
    // Skip anchor # or #^
    start += found.groups.beforeAnchor.length;
    // Include the text user has typed after anchor
    end = start;
    if (found.groups.afterAnchor) end += found.groups.afterAnchor.length;
  }
  const range = new Range(position.line, start, position.line, end);
  Logger.debug({ ctx, start: range.start, end: range.end });

  const completions = blocks.data
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
        edits.push(
          new TextEdit(
            new Range(blockPosition, blockPosition),
            // To represent a whole list, the anchor must be after the list with 1 empty line between
            block.type === DendronASTTypes.LIST
              ? `\n\n${AnchorUtils.anchor2string(anchor)}\n`
              : // To represent any other block, the anchor can be placed at the end of the block
                ` ${AnchorUtils.anchor2string(anchor)}`
          )
        );
      }
      return {
        label: block.text,
        // The region that will get replaced when inserting the block.
        range,
        insertText: insertValueOnly
          ? anchor.value
          : `#${AnchorUtils.anchor2string(anchor)}`,
        // If the block didn't have an anchor, we need to insert it ourselves
        additionalTextEdits: edits,
        sortText: padWithZero(index),
      };
    })
    .filter(isNotUndefined);
  const duration = getDurationMilliseconds(timestampStart);
  Logger.debug({ ctx, completionCount: completions.length, duration });
  return completions;
}

export const activate = (context: ExtensionContext) => {
  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      "markdown",
      {
        provideCompletionItems,
      },
      "[", // for wikilinks and references
      "#", // for hashtags
      "@" // for user tags
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
