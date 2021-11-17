import {
  ConfigUtils,
  DefaultMap,
  isNotUndefined,
  NoteProps,
  NoteUtils,
  Position,
  TAGS_HIERARCHY,
  TaskNoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import {
  AnchorUtils,
  BlockAnchor,
  DendronASTDest,
  DendronASTTypes,
  HashTag,
  MDUtilsV5,
  NoteRefNoteV4,
  ProcMode,
  UserTag,
  WikiLinkNoteV4,
} from "@dendronhq/engine-server";
import _ from "lodash";
import { DateTime } from "luxon";
import { FrontmatterContent } from "mdast";
import visit from "unist-util-visit";
import {
  DecorationOptions,
  DecorationRangeBehavior,
  Diagnostic,
  Range,
  TextDocument,
  TextEditor,
  TextEditorDecorationType,
  ThemableDecorationAttachmentRenderOptions,
  ThemeColor,
  window,
} from "vscode";
import { Logger } from "../logger";
import { CodeConfigKeys, DateTimeFormat } from "../types";
import { VSCodeUtils } from "../utils";
import { containsNonDendronUri } from "../utils/md";
import { getFrontmatterTags, parseFrontmatter } from "../utils/yaml";
import { getConfigValue, getDWorkspace } from "../workspace";
import {
  warnBadFrontmatterContents,
  warnMissingFrontmatter,
} from "./codeActionProvider";

/** Wait this long in miliseconds before trying to update decorations. */
const DECORATION_UPDATE_DELAY = 100;

/** Decorators only decorate what's visible on the screen. To avoid the user
 * seeing undecorated text if they scroll too quickly, we decorate some of the
 * text surrounding what's visible on the screen. This number determines how
 * many lines (above top and below bottom) surrounding the visible text should
 * be decorated. */
const VISIBLE_RANGE_MARGIN = 20;

export const DECORATION_TYPE = {
  timestamp: window.createTextEditorDecorationType({}),
  blockAnchor: window.createTextEditorDecorationType({
    opacity: "40%",
    rangeBehavior: DecorationRangeBehavior.ClosedOpen,
  }),
  /** Decoration for wikilinks that point to valid notes. */
  wikiLink: window.createTextEditorDecorationType({
    color: new ThemeColor("editorLink.activeForeground"),
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
  }),
  /** Decoration for wikilinks that do *not* point to valid notes (e.g. broken). */
  brokenWikilink: window.createTextEditorDecorationType({
    color: new ThemeColor("editorWarning.foreground"),
    backgroundColor: new ThemeColor("editorWarning.background"),
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
  }),
  /** Decoration for the alias part of wikilinks. */
  alias: window.createTextEditorDecorationType({
    fontStyle: "italic",
  }),
  taskNote: window.createTextEditorDecorationType({
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
  }),
};

export const DECORATOR = new Map<
  string,
  (node: any, document: TextDocument) => DecorationAndType[]
>([
  [DendronASTTypes.FRONTMATTER, decorateFrontmatter],
  [DendronASTTypes.BLOCK_ANCHOR, decorateBlockAnchor],
  [DendronASTTypes.HASHTAG, decorateHashTag],
  [DendronASTTypes.USERTAG, decorateUserTag],
  [DendronASTTypes.WIKI_LINK, decorateWikiLink],
  [DendronASTTypes.REF_LINK_V2, decorateReference],
  [DendronASTTypes.REF_LINK, decorateReference],
]);

export type DecorationAndType = {
  type: TextEditorDecorationType;
  decoration: DecorationOptions;
};

export function delayedUpdateDecorations(
  updateDelay: number = DECORATION_UPDATE_DELAY
) {
  const beforeTimerPath =
    VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
  setTimeout(() => {
    const editor = VSCodeUtils.getActiveTextEditor();
    // Avoid running this if the same document is no longer open
    if (editor && editor.document.uri.fsPath === beforeTimerPath) {
      try {
        updateDecorations(editor);
      } catch (error) {
        Logger.info({ ctx: "delayedUpdateDecorations", error });
      }
    }
  }, updateDelay);
}

export function updateDecorations(activeEditor: TextEditor) {
  const ctx = "updateDecorations";
  // Warn for missing or bad frontmatter and broken wikilinks
  const allWarnings: Diagnostic[] = [];
  const activeDecorations = new DefaultMap<
    TextEditorDecorationType,
    DecorationOptions[]
  >(() => []);
  // Only show decorations & warnings for notes
  let note: NoteProps | undefined;
  try {
    note = VSCodeUtils.getNoteFromDocument(activeEditor.document);
    if (_.isUndefined(note)) return {};
  } catch (error) {
    Logger.info({
      ctx,
      msg: "Unable to check if decorations should be updated",
      error,
    });
    return {};
  }
  // Only decorate visible ranges, of which there could be multiple if the document is open in multiple tabs
  const ranges = VSCodeUtils.mergeOverlappingRanges(activeEditor.visibleRanges);

  for (const range of ranges) {
    const decorateRange = VSCodeUtils.padRange({
      range,
      padding: VISIBLE_RANGE_MARGIN,
    });
    const text = activeEditor.document.getText(decorateRange);
    const proc = MDUtilsV5.procRemarkParse(
      {
        mode: ProcMode.FULL,
        parseOnly: true,
      },
      {
        dest: DendronASTDest.MD_DENDRON,
        engine: getDWorkspace().engine,
        vault: note.vault,
        fname: note.fname,
      }
    );
    const tree = proc.parse(text);
    let frontmatter: FrontmatterContent | undefined;

    visit(tree, (node) => {
      const decorator = DECORATOR.get(node.type);
      // Need to update node position with the added offset from the range
      node.position!.start.line += decorateRange.start.line;
      node.position!.end.line += decorateRange.start.line;
      if (decorator) {
        const decorations = decorator(node, activeEditor.document);
        for (const { type, decoration } of decorations) {
          activeDecorations.get(type).push(decoration);
        }
      }
      if (node.type === DendronASTTypes.FRONTMATTER)
        frontmatter = node as FrontmatterContent;
    });

    if (decorateRange.start.line === 0) {
      // Can't check frontmatter if frontmatter is not visible
      if (_.isUndefined(frontmatter)) {
        allWarnings.push(warnMissingFrontmatter(activeEditor.document));
      } else {
        allWarnings.push(
          ...warnBadFrontmatterContents(activeEditor.document, frontmatter)
        );
      }
    }
  }

  // Activate the decorations
  Logger.info({
    ctx,
    msg: `Displaying ${allWarnings.length} warnings and ${activeDecorations.size} decorations`,
  });
  for (const [type, decorations] of activeDecorations.entries()) {
    activeEditor.setDecorations(type, decorations);
  }

  // Clear out any old decorations left over from last pass
  for (const type of _.values(DECORATION_TYPE)) {
    if (!activeDecorations.has(type)) {
      activeEditor.setDecorations(type, []);
    }
  }

  return {
    allDecorations: activeDecorations,
    allWarnings,
  };
}

function decorateFrontmatter(
  frontmatter: FrontmatterContent,
  _document: TextDocument
): DecorationAndType[] {
  const { value: contents, position } = frontmatter;
  if (_.isUndefined(position)) return []; // should never happen
  // Decorate the timestamps
  const tsConfig = getConfigValue(
    CodeConfigKeys.DEFAULT_TIMESTAMP_DECORATION_FORMAT
  ) as DateTimeFormat;
  const formatOption = DateTime[tsConfig];

  const entries = contents.split("\n");
  const lineOffset =
    VSCodeUtils.point2VSCodePosition(position.start).line +
    1; /* `---` line of frontmatter */
  const timestampDecorations = entries
    .map((entry, line): undefined | DecorationAndType => {
      const match = NoteUtils.RE_FM_UPDATED_OR_CREATED.exec(entry);
      if (!_.isNull(match) && match.groups?.timestamp) {
        const timestamp = DateTime.fromMillis(
          _.toInteger(match.groups.timestamp)
        );
        const decoration: DecorationOptions = {
          range: new Range(
            line + lineOffset,
            match.groups.beforeTimestamp.length,
            line + lineOffset,
            match.groups.beforeTimestamp.length + match.groups.timestamp.length
          ),
          renderOptions: {
            after: {
              contentText: `  (${timestamp.toLocaleString(formatOption)})`,
            },
          },
        };
        return { type: DECORATION_TYPE.timestamp, decoration };
      }
      return undefined;
    })
    .filter(isNotUndefined);

  // Decorate the frontmatter tags
  const tags = getFrontmatterTags(parseFrontmatter(contents));
  const fmTagDecorations = _.flatMap(tags, (tag) =>
    decorateTag({
      fname: `${TAGS_HIERARCHY}${tag.value}`,
      position: tag.position,
      lineOffset,
    })
  );
  return _.concat(timestampDecorations, fmTagDecorations);
}

function decorateBlockAnchor(blockAnchor: BlockAnchor) {
  const position = blockAnchor.position;
  if (_.isUndefined(position)) return []; // should never happen

  const decoration: DecorationOptions = {
    range: VSCodeUtils.position2VSCodeRange(position),
  };
  return [{ type: DECORATION_TYPE.blockAnchor, decoration }];
}

function decorateHashTag(hashtag: HashTag, _document: TextDocument) {
  const position = hashtag.position;
  if (_.isUndefined(position)) return []; // should never happen

  return decorateTag({
    fname: hashtag.fname,
    position,
  });
}

function decorateTag({
  fname,
  position,
  lineOffset,
}: {
  fname: string;
  position: Position;
  lineOffset?: number;
}) {
  let before: ThemableDecorationAttachmentRenderOptions | undefined;
  const { color: backgroundColor, type: colorType } = NoteUtils.color({
    fname,
    notes: getDWorkspace().engine.notes,
  });
  if (
    colorType === "configured" ||
    !getDWorkspace().config.noRandomlyColoredTags
  ) {
    before = {
      contentText: " ",
      width: "0.8rem",
      height: "0.8rem",
      margin: "auto 0.2rem",
      border: "1px solid",
      borderColor: new ThemeColor("foreground"),
      backgroundColor,
    };
  }

  const type = linkedNoteType({ fname });
  const decoration: DecorationOptions = {
    range: VSCodeUtils.position2VSCodeRange(position, { line: lineOffset }),
    renderOptions: {
      before,
    },
  };

  return [{ type, decoration }];
}

export function linkedNoteType({
  fname,
  anchorStart,
  anchorEnd,
  vaultName,
  document,
}: {
  fname?: string;
  anchorStart?: string;
  anchorEnd?: string;
  vaultName?: string;
  document?: TextDocument;
}) {
  const ctx = "linkedNoteType";
  const { notes, vaults } = getDWorkspace().engine;
  const vault = vaultName
    ? VaultUtils.getVaultByName({ vname: vaultName, vaults })
    : undefined;
  // Vault specified, but can't find it.
  if (vaultName && !vault) return DECORATION_TYPE.brokenWikilink;

  let matchingNotes: NoteProps[];
  // Same-file links have `fname` undefined or empty string
  if (!fname && document) {
    const documentNote = VSCodeUtils.getNoteFromDocument(document);
    matchingNotes = documentNote ? [documentNote] : [];
  } else if (fname) {
    try {
      matchingNotes = NoteUtils.getNotesByFname({
        fname,
        vault,
        notes,
      });
    } catch (err) {
      Logger.info({
        ctx,
        msg: "error when looking for note",
        fname,
        vaultName,
        err,
      });
      return DECORATION_TYPE.brokenWikilink;
    }
  } else {
    matchingNotes = [VSCodeUtils.getNoteFromDocument(document!)!];
  }

  // Checking web URLs is not feasible, and checking wildcard references would be hard.
  // Let's just highlight them as existing for now.
  if (fname && (containsNonDendronUri(fname) || fname.endsWith("*")))
    return DECORATION_TYPE.wikiLink;

  if (anchorStart || anchorEnd) {
    const allAnchors = _.flatMap(matchingNotes, (note) =>
      Object.values(note.anchors)
    )
      .filter(isNotUndefined)
      .map(AnchorUtils.anchor2string);
    if (anchorStart && anchorStart !== "*" && !allAnchors.includes(anchorStart))
      return DECORATION_TYPE.brokenWikilink;
    if (anchorEnd && anchorEnd !== "*" && !allAnchors.includes(anchorEnd))
      return DECORATION_TYPE.brokenWikilink;
  }

  if (matchingNotes.length > 0) return DECORATION_TYPE.wikiLink;
  else return DECORATION_TYPE.brokenWikilink;
}

const RE_ALIAS = /(?<beforeAlias>\[\[)(?<alias>[^|]+)\|/;

function decorateWikiLink(wikiLink: WikiLinkNoteV4, document: TextDocument) {
  const position = wikiLink.position as Position | undefined;
  if (_.isUndefined(position)) return []; // should never happen

  const fname: string | undefined = wikiLink.value;
  const vaultName = wikiLink.data.vaultName;

  const type = linkedNoteType({
    fname,
    anchorStart: wikiLink.data.anchorHeader,
    vaultName,
    document,
  });
  const wikiLinkrange = VSCodeUtils.position2VSCodeRange(position);
  const options: DecorationOptions = {
    range: wikiLinkrange,
  };
  const decorations: DecorationAndType[] = [];

  // Highlight the alias part
  const linkText = document.getText(options.range);
  const aliasMatch = linkText.match(RE_ALIAS);
  if (
    aliasMatch &&
    aliasMatch.groups?.beforeAlias &&
    aliasMatch.groups?.alias
  ) {
    const { beforeAlias, alias } = aliasMatch.groups;
    decorations.push({
      type: DECORATION_TYPE.alias,
      decoration: {
        range: new Range(
          wikiLinkrange.start.line,
          wikiLinkrange.start.character + beforeAlias.length,
          wikiLinkrange.start.line,
          wikiLinkrange.start.character + beforeAlias.length + alias.length
        ),
      },
    });
  }

  // Wikilinks to a part of a task are not tasks themselves, so skip links like [[task.thing#part]]. Also skip broken wikilinks, they have no notes.
  if (!wikiLink.data.anchorHeader && type !== DECORATION_TYPE.brokenWikilink) {
    const taskDecoration = decorateTaskNote({
      range: wikiLinkrange,
      fname,
      vaultName,
    });
    if (taskDecoration) decorations.push(taskDecoration);
  }

  // Highlight the wikilink itself
  decorations.push({ type, decoration: options });
  return decorations;
}

const TASK_NOTE_DECORATION_COLOR = new ThemeColor(
  "editorLink.activeForeground"
);

/** Decorates the note `fname` in vault `vaultName` if the note is a task note. */
function decorateTaskNote({
  range,
  fname,
  vaultName,
}: {
  range: Range;
  fname: string | undefined;
  vaultName?: string;
}) {
  if (!fname) return;
  const { notes, vaults, config } = getDWorkspace().engine;
  const taskConfig = ConfigUtils.getTask(config);
  const vault = vaultName
    ? VaultUtils.getVaultByName({ vname: vaultName, vaults })
    : undefined;
  const note: NoteProps | undefined = NoteUtils.getNotesByFname({
    fname,
    vault,
    notes,
  })[0];
  if (!note || !TaskNoteUtils.isTaskNote(note)) return;

  // Determines whether the task link is preceded by an empty or full checkbox
  const status = TaskNoteUtils.getStatusSymbol({ note, taskConfig });

  const { due, owner, priority } = note.custom;
  const decorationString: string[] = [];
  if (due) decorationString.push(`due:${due}`);
  if (owner) decorationString.push(`@${owner}`);
  if (priority) {
    const prioritySymbol = TaskNoteUtils.getPrioritySymbol({
      note,
      taskConfig,
    });
    if (prioritySymbol) decorationString.push(`priority:${prioritySymbol}`);
  }
  if (note.tags) {
    const tags = _.isString(note.tags) ? [note.tags] : note.tags;
    decorationString.push(...tags.map((tag) => `#${tag}`));
  }

  const decoration: DecorationAndType = {
    type: DECORATION_TYPE.taskNote,
    decoration: {
      range,
      renderOptions: {
        before: {
          contentText: status,
          color: TASK_NOTE_DECORATION_COLOR,
          fontWeight: "lighter",
          margin: "0 0.5rem 0 0.15rem",
        },
        after: {
          contentText: decorationString.join(" "),
          color: TASK_NOTE_DECORATION_COLOR,
          fontWeight: "lighter",
          margin: "0 0.4rem 0 0.25rem",
        },
      },
    },
  };
  return decoration;
}

function decorateUserTag(userTag: UserTag, _document: TextDocument) {
  const position = userTag.position as Position;
  if (_.isUndefined(position)) return [];

  const type = linkedNoteType({
    fname: userTag.fname,
  });

  return [
    { type, decoration: { range: VSCodeUtils.position2VSCodeRange(position) } },
  ];
}

function decorateReference(reference: NoteRefNoteV4, document: TextDocument) {
  const position = reference.position as Position;
  if (_.isUndefined(position)) return [];

  const type = linkedNoteType({
    fname: reference.data.link.from.fname,
    anchorStart: reference.data.link.data.anchorStart,
    anchorEnd: reference.data.link.data.anchorEnd,
    vaultName: reference.data.link.data.vaultName,
    document,
  });
  const decoration: DecorationOptions = {
    range: VSCodeUtils.position2VSCodeRange(position),
  };

  return [{ type, decoration }];
}
