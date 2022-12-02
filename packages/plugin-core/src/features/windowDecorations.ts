import {
  ConfigService,
  ConfigUtils,
  DateTime,
  debounceAsyncUntilComplete,
  Decoration,
  DendronASTDest,
  DEngineClient,
  fromPromise,
  groupBy,
  isNotUndefined,
  mapValues,
  NoteProps,
  NotePropsMeta,
  NoteUtils,
  ProcFlavor,
  URI,
} from "@dendronhq/common-all";
import {
  DecorationHashTag,
  DecorationTaskNote,
  DecorationTimestamp,
  DecorationWikilink,
  DECORATION_TYPES,
  isDecorationHashTag,
  NoteRefDecorator,
  NoteRefUtils,
} from "@dendronhq/unified";
import * as Sentry from "@sentry/node";
import _ from "lodash";
import {
  DecorationOptions,
  DecorationRangeBehavior,
  Diagnostic,
  Range,
  TextDocument,
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
import { NoteRefComment } from "./NoteRefComment";

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
  noteRef: window.createTextEditorDecorationType({
    color: new ThemeColor("editorLink.activeForeground"),
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
  }),
  brokenNoteRef: window.createTextEditorDecorationType({
    color: new ThemeColor("editorWarning.foreground"),
    backgroundColor: new ThemeColor("editorWarning.background"),
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
  }),
  taskNote: window.createTextEditorDecorationType({
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
  }),
};

export type DendronDecoration<T = any> = {
  /**
   * type: mapping of {@link: DECORATION_TYPES} -> {@link: TextEditorDecorationType}
   */
  type: TextEditorDecorationType;
  /**
   * VSCode DecorationOptions
   */
  decoration: DecorationOptions;
  /**
   * Specific to type of decoration
   */
  data?: T;
};

type DendronNoteRefDecoration = Required<
  DendronDecoration<NoteRefDecorator["data"]>
>;

function renderNoteRef({
  reference,
  note,
  engine,
}: {
  reference: string;
  note: NotePropsMeta;
  engine: DEngineClient;
}) {
  const id = `note.id-${reference}`;
  const fakeNote = NoteUtils.createForFake({
    // Mostly same as the note...
    fname: note.fname,
    vault: note.vault,
    // except the changed ID to avoid caching
    id,
    // And using the reference as the text of the note
    contents: reference,
  });
  fakeNote.config = { global: { enablePrettyRefs: false } };
  return engine.renderNote({
    id: fakeNote.id,
    note: fakeNote,
    dest: DendronASTDest.HTML,
    flavor: ProcFlavor.HOVER_PREVIEW,
  });
}

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

async function addInlineNoteRefs(opts: {
  decorations: DendronNoteRefDecoration[];
  document: TextDocument;
}) {
  const ctx = "addInlineNoteRefs";
  const inlineNoteRefs =
    ExtensionProvider.getCommentThreadsState().inlineNoteRefs;
  const docKey = opts.document.uri.toString();
  const lastNoteRefThreadMap = inlineNoteRefs.get(docKey);
  const newNoteRefThreadMap = new Map();

  const disposeLastNoteRefThreadMap = () => {
    for (const thread of lastNoteRefThreadMap.values()) {
      thread.dispose();
    }
  };

  // if decoratorations is zero it could mean:
  // 1. no note refs in document in which case we dispose of everything
  // 2. we scrolled out of the range of the note refs
  if (opts.decorations.length === 0) {
    disposeLastNoteRefThreadMap();
    inlineNoteRefs.set(docKey, newNoteRefThreadMap);
    return;
  }
  const range2String = (range: Range) => {
    return [
      range.start.line,
      range.start.character,
      range.end.line,
      range.end.character,
    ].join(",");
  };

  const engine = ExtensionProvider.getEngine();

  const noteRefCommentController =
    ExtensionProvider.getExtension().noteRefCommentController;

  Logger.debug({
    ctx,
    msg: "enter",
    docKey,
  });

  // update all comment threads as needed
  await Promise.all(
    opts.decorations.map(async (ent) => {
      if (ent.data.noteMeta === undefined) {
        return;
      }
      const key = [
        docKey,
        range2String(ent.decoration.range),
        NoteRefUtils.dnodeRefLink2String(ent.data.link),
      ].toString();

      if (lastNoteRefThreadMap.has(key)) {
        Logger.debug({ ctx, msg: "found key, restoring", key });
        newNoteRefThreadMap.set(key, lastNoteRefThreadMap.get(key));
        lastNoteRefThreadMap.delete(key);
      } else {
        Logger.debug({ ctx, msg: "no key found, creating", key });
        const reference = opts.document.getText(ent.decoration.range);
        const renderResult = await fromPromise(
          renderNoteRef({
            reference,
            note: ent.data.noteMeta,
            engine,
          }),
          (err) => err
        );
        if (renderResult.isErr()) {
          return;
        }
        const renderResp = renderResult.value;
        // const renderResp = await engine.renderNote({ id });
        const thread = noteRefCommentController.createCommentThread(
          opts.document.uri,
          ent.decoration.range,
          [new NoteRefComment(renderResp)]
        );
        thread.canReply = false;
        thread.label = ent.data.noteMeta.title;
        newNoteRefThreadMap.set(key, thread);
      }
    })
  );
  Logger.debug({
    ctx,
    msg: "exit",
    docKey,
  });
  inlineNoteRefs.set(docKey, newNoteRefThreadMap);
  // dispose of old thread values
  disposeLastNoteRefThreadMap();
}

// see [[Decorations|dendron://dendron.docs/pkg.plugin-core.ref.decorations]] for further docs
export async function updateDecorations(editor: TextEditor): Promise<{
  allDecorations?: Map<TextEditorDecorationType, DecorationOptions[]>;
  allWarnings?: Diagnostic[];
}> {
  try {
    const ctx = "updateDecorations";
    const engine = ExtensionProvider.getEngine();
    const configReadResult = await ConfigService.instance().readConfig(
      URI.file(engine.wsRoot)
    );
    if (configReadResult.isErr()) {
      throw configReadResult.error;
    }
    const config = configReadResult.value;
    if (ConfigUtils.getWorkspace(config).enableEditorDecorations === false) {
      // Explicitly disabled, stop here.
      return {};
    }
    Logger.debug({ ctx, msg: "enter" });

    const getInputRanges = (editor: TextEditor) => {
      const inputRanges = VSCodeUtils.mergeOverlappingRanges(
        editor.visibleRanges.map((range) =>
          VSCodeUtils.padRange({
            range,
            padding: VISIBLE_RANGE_MARGIN,
            zeroCharacter: true,
          })
        )
      );

      return inputRanges.map((range) => {
        return {
          range: VSCodeUtils.toPlainRange(range),
          text: editor.document.getText(range),
        };
      });
    };

    const shouldAbort = (editor: TextEditor) => {
      // There's another execution that has already been called after this was
      // run. That means these results are stale. If existing lines have shifted
      // up or down since this function execution was started, setting the
      // decorations now will place the decorations at bad positions in the
      // document. On the other hand, if we do nothing VSCode will smartly move
      // those decorations to their new locations. With another execution
      // already scheduled, it's better to just wait for those decorations to
      // come in.
      return (
        debouncedUpdateDecorations.states.get(
          updateDecorationsKeyFunction(editor)
        ) === "trailing"
      );
    };

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
    const ranges = getInputRanges(editor);
    const out = await engine.getDecorations({
      id: note.id,
      ranges,
      text: editor.document.getText(),
    });

    if (shouldAbort(editor)) {
      return {};
    }

    const { data, error } = out;
    Logger.info({
      ctx,
      msg: "decorating...",
      payload: {
        error,
        decorationsLength: data?.decorations?.length,
        diagnosticsLength: data?.diagnostics?.length,
      },
    });

    // begin: extract decorations
    const vscodeDecorations = data?.decorations
      ?.map(mapDecoration)
      .filter(isNotUndefined);
    // return if no decorations
    if (vscodeDecorations === undefined) return {};

    // begin: apply decorations
    // NOTE: we group decorations so we can use `editor.setDecorations(type, decorations)` to apply values in bulk
    const activeDecorations = mapValues(
      groupBy(vscodeDecorations, (decoration) => decoration.type),
      (decorations) => decorations.map((item) => item.decoration)
    );
    for (const [type, payload] of activeDecorations.entries()) {
      editor.setDecorations(type, payload);
    }

    // begin: apply inline note refs
    if (config.dev?.enableExperimentalInlineNoteRef) {
      const noteRefDecorators: DendronNoteRefDecoration[] =
        vscodeDecorations.filter((ent) => {
          return ent.type === EDITOR_DECORATION_TYPES.noteRef;
        }) as DendronNoteRefDecoration[];

      Logger.debug({
        ctx,
        msg: "noteRefDecorators",
        noteRefDecorators: noteRefDecorators.map((ent) => {
          return { range: ent.decoration.range, link: ent.data.link };
        }),
      });
      await addInlineNoteRefs({
        decorations: noteRefDecorators,
        document: editor.document,
      });
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

function mapDecoration(decoration: Decoration): DendronDecoration | undefined {
  switch (decoration.type) {
    // Some decoration types require special processing to add per-decoration data
    case DECORATION_TYPES.timestamp:
      return mapTimestamp(decoration as DecorationTimestamp);
    case DECORATION_TYPES.brokenNoteRef:
    case DECORATION_TYPES.noteRef:
      return mapNoteRefLink(decoration as NoteRefDecorator);
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
): DendronDecoration | undefined {
  const type = EDITOR_DECORATION_TYPES[decoration.type];
  if (!type) return undefined;

  return {
    type,
    decoration: {
      range: VSCodeUtils.toRangeObject(decoration.range),
    },
    data: decoration.data,
  };
}

function mapTimestamp(decoration: DecorationTimestamp): DendronDecoration {
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

function mapNoteRefLink(
  decoration: NoteRefDecorator
): DendronNoteRefDecoration | undefined {
  return mapBasicDecoration(decoration) as DendronNoteRefDecoration;
}

function mapWikilink(
  decoration: DecorationWikilink | DecorationHashTag
): DendronDecoration | undefined {
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
): DendronDecoration | undefined {
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
