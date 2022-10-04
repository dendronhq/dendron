import {
  ALIAS_NAME,
  assertUnreachable,
  DEngineClient,
  DNoteAnchor,
  ERROR_SEVERITY,
  genUUIDInsecure,
  isNotUndefined,
  LINK_NAME,
  LINK_NAME_NO_SPACES,
  NoteLookupUtils,
  NoteProps,
  NotePropsMeta,
  TAGS_HIERARCHY,
  USERS_HIERARCHY,
  VaultUtils,
} from "@dendronhq/common-all";
import { DConfig, getDurationMilliseconds } from "@dendronhq/common-server";
import {
  AnchorUtils,
  DendronASTDest,
  DendronASTTypes,
  HashTagUtils,
  HASHTAG_REGEX_LOOSE,
  LinkUtils,
  MDUtilsV5,
  ProcFlavor,
  UserTagUtils,
  USERTAG_REGEX_LOOSE,
} from "@dendronhq/unified";
import _ from "lodash";
import {
  CancellationToken,
  CompletionItem,
  CompletionItemKind,
  CompletionList,
  ExtensionContext,
  languages,
  MarkdownString,
  Position,
  Range,
  TextDocument,
  TextEdit,
} from "vscode";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { sentryReportingCallback } from "../utils/analytics";
import { VSCodeUtils } from "../vsCodeUtils";
import { DendronExtension } from "../workspace";
import { WSUtils } from "../WSUtils";

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
      // note name followed by brackets
      "(" +
        "(" +
          `(?<note>${LINK_NAME})?` +
          "(?<afterNote>" +
            // anchor
            "(?<hash>#+)(?<anchor>\\^)?" +
            // text of the header or anchor
            "[^\\[\\]]" +
          ")?" +
          // Must have ending brackets
          "\\]\\]" +
        ")|(?<noBracket>" +
          // Or, note name with no spaces and no brackets.
          // The distinction is needed to avoid consuming text following a link if there's no closing bracket.
          `(?<noteNoSpace>${LINK_NAME_NO_SPACES})?` +
          "(?<afterNoteNoSpace>" +
            // anchor
            "(?<hashNoSpace>#+)(?<anchorNoSpace>\\^)?" +
            // text of the header or anchor
            "[^\\[\\]]" +
          ")?" +
        ")" +
        // No ending brackets
      ")" +
    ")" +
    "|" + // or it may be a hashtag (potentially a hashtag that's empty)
    HASHTAG_REGEX_LOOSE.source + "?" +
    "|" + // or it may be a user tag
    USERTAG_REGEX_LOOSE.source + "?" +
  ")",
  "g"
);

async function noteToCompletionItem({
  note,
  range,
  lblTransform,
  insertTextTransform,
  sortTextTransform,
}: {
  note: NoteProps;
  range: Range;
  lblTransform?: (note: NoteProps) => string;
  insertTextTransform?: (note: NoteProps) => Promise<string>;
  sortTextTransform?: (note: NoteProps) => string | undefined;
}): Promise<CompletionItem> {
  const label = lblTransform ? lblTransform(note) : note.fname;
  const insertText = insertTextTransform
    ? await insertTextTransform(note)
    : note.fname;
  const sortText = sortTextTransform ? sortTextTransform(note) : undefined;
  const item: CompletionItem = {
    label,
    insertText,
    sortText,
    kind: CompletionItemKind.File,
    detail: VaultUtils.getName(note.vault),
    range,
  };
  return item;
}

async function provideCompletionsForTag({
  type,
  engine,
  found,
  range,
}: {
  found: RegExpMatchArray | null;
  type: "hashtag" | "usertag";
  engine: DEngineClient;
  range: Range;
}) {
  let prefix = "";
  let tagValue = "";
  switch (type) {
    case "hashtag": {
      prefix = TAGS_HIERARCHY;
      tagValue = HashTagUtils.extractTagFromMatch(found) || "";
      break;
    }
    case "usertag": {
      prefix = USERS_HIERARCHY;
      tagValue = UserTagUtils.extractTagFromMatch(found) || "";
      break;
    }
    default: {
      assertUnreachable(type);
    }
  }
  const qsRaw = `${prefix}.${tagValue}`;
  const notes = await NoteLookupUtils.lookup({
    qsRaw,
    engine,
  });
  return Promise.all(
    notes.map((note) =>
      noteToCompletionItem({
        note,
        range,
        lblTransform: (note) => `${note.fname.slice(prefix.length)}`,
        insertTextTransform: (note) =>
          Promise.resolve(`${note.fname.slice(prefix.length)}`),
      })
    )
  );
}

export const provideCompletionItems = sentryReportingCallback(
  async (
    document: TextDocument,
    position: Position
  ): Promise<CompletionList | undefined> => {
    const ctx = "provideCompletionItems";
    const startTime = process.hrtime();
    // No-op if we're not in a Dendron Workspace
    if (!ExtensionProvider.getExtension().isActive()) {
      return;
    }

    const line = document.lineAt(position).text;
    Logger.info({ ctx, position, msg: "enter" });

    // get all matches
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

    // if no match found, exit early
    if (
      _.isUndefined(found) ||
      _.isUndefined(found.index) ||
      _.isUndefined(found.groups)
    )
      return;

    Logger.debug({ ctx, regexMatch: found });

    // if match is hash, delegate to block auto complete
    if (
      (found.groups.hash || found.groups.hashNoSpace) &&
      found.index + (found.groups.beforeAnchor?.length || 0) >
        position.character
    ) {
      Logger.info({ ctx, msg: "letting block autocomplete take over" });
      return;
    }

    // do autocomplete
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
      end =
        start +
        (found.groups.note?.length || found.groups.noteNoSpace?.length || 0);
    }
    const range = new Range(position.line, start, position.line, end);

    const engine = ExtensionProvider.getEngine();
    const { wsRoot } = engine;
    let completionItems: CompletionItem[];
    const completionsIncomplete = true;
    const currentVault = WSUtils.getVaultFromDocument(document);

    if (found?.groups?.hashTag) {
      completionItems = await provideCompletionsForTag({
        type: "hashtag",
        engine,
        found,
        range,
      });
    } else if (found?.groups?.userTag) {
      completionItems = await provideCompletionsForTag({
        type: "usertag",
        engine,
        found,
        range,
      });
    } else {
      let qsRaw: string;
      if (found?.groups?.note) {
        qsRaw = found?.groups?.note;
      } else if (found?.groups?.noteNoSpace) {
        qsRaw = found?.groups?.noteNoSpace;
      } else {
        qsRaw = "";
      }
      const insertTextTransform = async (note: NoteProps) => {
        let resp = note.fname;
        if (found?.groups?.noBracket !== undefined) {
          resp += "]]";
        }
        if (
          currentVault &&
          !VaultUtils.isEqual(currentVault, note.vault, wsRoot)
        ) {
          const sameNameNotes = (
            await engine.findNotesMeta({ fname: note.fname })
          ).length;
          if (sameNameNotes > 1) {
            // There are multiple notes with the same name in multiple vaults,
            // and this note is in a different vault than the current note.
            // To generate a link to this note, we have to do an xvault link.
            resp = `${VaultUtils.toURIPrefix(note.vault)}/${resp}`;
          }
        }
        return resp;
      };

      const notes = await NoteLookupUtils.lookup({
        qsRaw,
        engine,
      });

      completionItems = await Promise.all(
        notes.map((note) =>
          noteToCompletionItem({
            note,
            range,
            insertTextTransform,
            sortTextTransform: (note) => {
              if (
                currentVault &&
                !VaultUtils.isEqual(currentVault, note.vault, wsRoot)
              ) {
                // For notes from other vaults than the current note, sort them after notes from the current vault.
                // x will get sorted after numbers, so these will appear after notes without x
                return `x${note.fname}`;
              }
              return;
            },
          })
        )
      );
    }

    const duration = getDurationMilliseconds(startTime);
    const completionList = new CompletionList(
      completionItems,
      completionsIncomplete
    );
    Logger.debug({
      ctx,
      completionItemsLength: completionList.items.length,
      incomplete: completionList.isIncomplete,
      duration,
    });
    return completionList;
  }
);

/**
 * Debounced version of {@link provideCompletionItems}.
 *
 * We trigger on both leading and trailing edge of the debounce window because:
 * 1. without the leading edge we lose focus to the Intellisense
 * 2. without the trailing edge we may miss some keystrokes from the users at the end.
 *
 * related discussion: https://github.com/dendronhq/dendron/pull/3116#discussion_r902075154
 */
export const debouncedProvideCompletionItems = _.debounce(
  provideCompletionItems,
  100,
  { leading: true, trailing: true }
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

    const engine = ExtensionProvider.getEngine();
    const { vaults, wsRoot } = engine;
    const vault = VaultUtils.getVaultByName({ vname, vaults });
    if (_.isUndefined(vault)) {
      Logger.info({ ctx, msg: "vault not found", fname, vault, wsRoot });
      return;
    }

    const note = (await engine.findNotesMeta({ fname, vault }))[0];

    if (_.isUndefined(note)) {
      Logger.info({ ctx, msg: "note not found", fname, vault, wsRoot });
      return;
    }

    try {
      // Render a preview of this note
      const proc = MDUtilsV5.procRemarkFull(
        {
          noteToRender: note,
          dest: DendronASTDest.MD_REGULAR,
          vault: note.vault,
          fname: note.fname,
          config: DConfig.readConfigSync(engine.wsRoot, true),
          wsRoot,
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
  const engine = ExtensionProvider.getEngine();

  let otherFile = false;
  let note: NotePropsMeta | undefined;
  if (found.groups?.note) {
    // This anchor will be to another note, e.g. [[note#
    // `groups.note` may have vault name, so let's try to parse that
    const link = LinkUtils.parseLinkV2({ linkString: found.groups.note });
    const vault = link?.vaultName
      ? VaultUtils.getVaultByName({
          vaults: engine.vaults,
          vname: link?.vaultName,
        })
      : undefined;
    // If we couldn't find the linked note, don't do anything
    if (_.isNull(link) || _.isUndefined(link.value)) return;
    note = (await engine.findNotesMeta({ fname: link.value, vault }))[0];
    otherFile = true;
  } else {
    // This anchor is to the same file, e.g. [[#
    note = await WSUtils.getNoteFromDocument(document);
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

  const blocks = await ExtensionProvider.getEngine().getNoteBlocks({
    id: note.id,
    filterByAnchorType,
  });
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
        // we debounce this provider since we don't want lookup to be triggered on every keystroke.
        provideCompletionItems: debouncedProvideCompletionItems,
      },

      "[", // for wikilinks and references
      "#", // for hashtags
      "@", // for user tags
      "" // for new levels in the hieirarchy
    )
  );
  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      "markdown",
      {
        /**
         * we don't have to debounce this since it is not triggered on every keystroke
         * and is ligher than {@link provideCompletionItems} in general.
         */
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
