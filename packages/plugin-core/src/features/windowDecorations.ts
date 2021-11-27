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
  DECORATION_TYPES,
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
import { sentryReportingCallback } from "../utils/analytics";
import { containsNonDendronUri } from "../utils/md";
import {
  getFrontmatterTags,
  parseFrontmatter,
} from "@dendronhq/common-server/src/yaml";
import { getConfigValue, getDWorkspace } from "../workspace";
import {
  checkAndWarnBadFrontmatter,
  warnMissingFrontmatter,
} from "./codeActionProvider";

/** Wait this long in miliseconds before trying to update decorations. */
const DECORATION_UPDATE_DELAY = 100;

/** If calculating decorations takes longer than this in miliseconds, give up and warn the user. */
const DECORATION_MAX_TIME = 100;

let WARNED_USER = false;
/** Warn the user once if we ever have trouble computing decorations quickly enough for their note. */
function warnExpensiveDecorations() {
  if (WARNED_USER) return;
  WARNED_USER = true;
  return window.showWarningMessage(
    "Dendron is having trouble with link highlighting right now." +
      " Some links may not be highlighted to keep your Dendron working smoothly."
  );
}

/** Decorators only decorate what's visible on the screen. To avoid the user
 * seeing undecorated text if they scroll too quickly, we decorate some of the
 * text surrounding what's visible on the screen. This number determines how
 * many lines (above top and below bottom) surrounding the visible text should
 * be decorated. */
const VISIBLE_RANGE_MARGIN = 20;

export const DECORATION_TYPE: {
  [key in keyof typeof DECORATION_TYPE_KEYS]: TextEditorDecorationType;
} = {
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

export const updateDecorations = sentryReportingCallback(
  (editor: TextEditor) => {
    const ctx = "updateDecorations";
    const { engine } = getDWorkspace();
    if (
      ConfigUtils.getWorkspace(engine.config).enableEditorDecorations === false
    ) {
      // Explicitly disabled, stop here.
      return {};
    }

    const activeDecorations = new DefaultMap<
      TextEditorDecorationType,
      DecorationOptions[]
    >(() => []);
    // Only show decorations & warnings for notes
    let note: NoteProps | undefined;
    try {
      note = VSCodeUtils.getNoteFromDocument(editor.document);
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
    const ranges = VSCodeUtils.mergeOverlappingRanges(
      editor.visibleRanges.map((range) =>
        VSCodeUtils.padRange({
          range,
          padding: VISIBLE_RANGE_MARGIN,
          zeroCharacter: true,
        })
      )
    );

    // Activate the decorations
    Logger.info({
      ctx,
      msg: `Displaying ${allWarnings.length} warnings and ${activeDecorations.size} decorations`,
    });
    for (const [type, decorations] of activeDecorations.entries()) {
      editor.setDecorations(type, decorations);
    }

    // Clear out any old decorations left over from last pass
    for (const type of _.values(DECORATION_TYPE)) {
      if (!activeDecorations.has(type)) {
        editor.setDecorations(type, []);
      }
    }

    return {
      allDecorations: activeDecorations,
      allWarnings,
    };
  }
);

function decorateBlockAnchor(blockAnchor: BlockAnchor) {
  const position = blockAnchor.position;
  if (_.isUndefined(position)) return []; // should never happen

  const decoration: DecorationOptions = {
    range: VSCodeUtils.position2VSCodeRange(position),
  };
  return [{ type: DECORATION_TYPE.blockAnchor, decoration }];
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
