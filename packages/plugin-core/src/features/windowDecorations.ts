import {
  ConfigUtils,
  DateTime,
  Decoration,
  groupBy,
  mapValues,
  isNotUndefined,
  NoteProps,
  debounceAsyncUntilComplete,
} from "@dendronhq/common-all";
import * as Sentry from "@sentry/node";
import {
  DECORATION_TYPES,
  DecorationTimestamp,
  DecorationHashTag,
  isDecorationHashTag,
  DecorationWikilink,
  DecorationTaskNote,
} from "@dendronhq/unified";
import _ from "lodash";
import {
  DecorationOptions,
  DecorationRangeBehavior,
  Diagnostic,
  TextEditor,
  TextEditorDecorationType,
  ThemeColor,
  window,
} from "vscode";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { CodeConfigKeys, DateTimeFormat } from "../types";
import { delayedFrontmatterWarning } from "../utils/frontmatter";
import { VSCodeUtils } from "../vsCodeUtils";
import { DConfig } from "@dendronhq/common-server";

/** Wait this long in miliseconds before trying to update decorations when a command forces a decoration update. */
const DECORATION_UPDATE_DELAY = 100;

/** Decorators only decorate what's visible on the screen. To avoid the user
 * seeing undecorated text if they scroll too quickly, we decorate some of the
 * text surrounding what's visible on the screen. This number determines how
 * many lines (above top and below bottom) surrounding the visible text should
 * be decorated. */
const VISIBLE_RANGE_MARGIN = 20;

/** Color used to highlight the decorator text portions ([x], priority:high etc.) of task notes. */
const TASK_NOTE_DECORATION_COLOR = new ThemeColor(
  "editorLink.activeForeground"
);

/** Color used for the border of the colored square of hashtags. */
const HASHTAG_BORDER_COLOR = new ThemeColor("foreground");

export const EDITOR_DECORATION_TYPES: {
  [key in keyof typeof DECORATION_TYPES]: TextEditorDecorationType;
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

function updateDecorationsKeyFunction(editor: TextEditor) {
  return editor.document.uri.fsPath;
}

export const debouncedUpdateDecorations = debounceAsyncUntilComplete({
  fn: updateDecorations,
  keyFn: updateDecorationsKeyFunction,
  timeout: 50,
  trailing: true,
});

// see [[Decorations|dendron://dendron.docs/pkg.plugin-core.ref.decorations]] for further docs
export async function updateDecorations(editor: TextEditor): Promise<{
  allDecorations?: Map<TextEditorDecorationType, DecorationOptions[]>;
  allWarnings?: Diagnostic[];
}> {
  try {
    const ctx = "updateDecorations";
    const engine = ExtensionProvider.getEngine();
    const config = DConfig.readConfigSync(engine.wsRoot, true);
    if (ConfigUtils.getWorkspace(config).enableEditorDecorations === false) {
      // Explicitly disabled, stop here.
      return {};
    }

    // Only show decorations & warnings for notes
    let note: NoteProps | undefined;
    try {
      note = await ExtensionProvider.getWSUtils().getNoteFromDocument(
        editor.document
      );
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
    const inputRanges = VSCodeUtils.mergeOverlappingRanges(
      editor.visibleRanges.map((range) =>
        VSCodeUtils.padRange({
          range,
          padding: VISIBLE_RANGE_MARGIN,
          zeroCharacter: true,
        })
      )
    );

    const ranges = inputRanges.map((range) => {
      return {
        range: VSCodeUtils.toPlainRange(range),
        text: editor.document.getText(range),
      };
    });
    const out = await engine.getDecorations({
      id: note.id,
      ranges,
      text: editor.document.getText(),
    });

    if (
      debouncedUpdateDecorations.states.get(
        updateDecorationsKeyFunction(editor)
      ) === "trailing"
    ) {
      // There's another execution that has already been called after this was
      // run. That means these results are stale. If existing lines have shifted
      // up or down since this function execution was started, setting the
      // decorations now will place the decorations at bad positions in the
      // document. On the other hand, if we do nothing VSCode will smartly move
      // those decorations to their new locations. With another execution
      // already scheduled, it's better to just wait for those decorations to
      // come in.
      return {};
    }
    const { data, error } = out;
    Logger.info({
      ctx,
      payload: {
        error,
        decorationsLength: data?.decorations?.length,
        diagnosticsLength: data?.diagnostics?.length,
      },
    });

    const vscodeDecorations = data?.decorations
      ?.map(mapDecoration)
      .filter(isNotUndefined);
    if (vscodeDecorations === undefined) return {};
    const activeDecorations = mapValues(
      groupBy(vscodeDecorations, (decoration) => decoration.type),
      (decorations) => decorations.map((item) => item.decoration)
    );

    for (const [type, decorations] of activeDecorations.entries()) {
      editor.setDecorations(type, decorations);
    }

    // Clear out any old decorations left over from last pass
    for (const type of _.values(EDITOR_DECORATION_TYPES)) {
      if (!activeDecorations.has(type)) {
        editor.setDecorations(type, []);
      }
    }

    const allWarnings =
      data?.diagnostics?.map((diagnostic) => {
        const diagnosticObject = new Diagnostic(
          VSCodeUtils.toRangeObject(diagnostic.range),
          diagnostic.message,
          diagnostic.severity
        );
        diagnosticObject.code = diagnostic.code;
        return diagnosticObject;
      }) || [];
    delayedFrontmatterWarning(editor.document.uri, allWarnings);

    return {
      allDecorations: activeDecorations,
      allWarnings,
    };
  } catch (err) {
    Sentry.captureException(err);
    throw err;
  }
}

function mapDecoration(decoration: Decoration): DecorationAndType | undefined {
  switch (decoration.type) {
    // Some decoration types require special processing to add per-decoration data
    case DECORATION_TYPES.timestamp:
      return mapTimestamp(decoration as DecorationTimestamp);
    case DECORATION_TYPES.brokenWikilink: // fallthrough deliberate
    case DECORATION_TYPES.wikiLink:
      return mapWikilink(decoration as DecorationWikilink); // some wikilinks are hashtags and need the color squares
    case DECORATION_TYPES.taskNote:
      return mapTaskNote(decoration as DecorationTaskNote);
    default:
      // For all other types, just their basic options in `EDITOR_DECORATION_TYPES` is enough.
      return mapBasicDecoration(decoration);
  }
}

function mapBasicDecoration(
  decoration: Decoration
): DecorationAndType | undefined {
  const type = EDITOR_DECORATION_TYPES[decoration.type];
  if (!type) return undefined;

  return {
    type,
    decoration: {
      range: VSCodeUtils.toRangeObject(decoration.range),
    },
  };
}

function mapTimestamp(decoration: DecorationTimestamp): DecorationAndType {
  const tsConfig = ExtensionProvider.getWorkspaceConfig().get(
    CodeConfigKeys.DEFAULT_TIMESTAMP_DECORATION_FORMAT
  ) as DateTimeFormat;
  const formatOption = DateTime[tsConfig];
  const timestamp = DateTime.fromMillis(decoration.timestamp);
  return {
    type: EDITOR_DECORATION_TYPES.timestamp,
    decoration: {
      range: VSCodeUtils.toRangeObject(decoration.range),
      renderOptions: {
        after: {
          contentText: `  (${timestamp.toLocaleString(formatOption)})`,
        },
      },
    },
  };
}

function mapWikilink(
  decoration: DecorationWikilink | DecorationHashTag
): DecorationAndType | undefined {
  if (isDecorationHashTag(decoration)) {
    const type = EDITOR_DECORATION_TYPES[decoration.type];
    if (!type) return undefined;
    return {
      type,
      decoration: {
        range: VSCodeUtils.toRangeObject(decoration.range),
        renderOptions: {
          before: {
            contentText: " ",
            width: "0.8rem",
            height: "0.8rem",
            margin: "auto 0.2rem",
            border: "1px solid",
            borderColor: HASHTAG_BORDER_COLOR,
            backgroundColor: decoration.color,
          },
        },
      },
    };
  }
  return mapBasicDecoration(decoration);
}

function mapTaskNote(
  decoration: DecorationTaskNote
): DecorationAndType | undefined {
  return {
    type: EDITOR_DECORATION_TYPES.taskNote,
    decoration: {
      range: VSCodeUtils.toRangeObject(decoration.range),
      renderOptions: {
        before: {
          contentText: decoration.beforeText,
          color: TASK_NOTE_DECORATION_COLOR,
          fontWeight: "200",
        },
        after: {
          contentText: decoration.afterText,
          color: TASK_NOTE_DECORATION_COLOR,
          fontWeight: "200",
        },
      },
    },
  };
}
