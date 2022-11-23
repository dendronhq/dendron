import {
  ConfigService,
  EngagementEvents,
  NoteScrolledSource,
  Time,
  URI,
} from "@dendronhq/common-all";
import { WorkspaceUtils } from "@dendronhq/engine-server";
import _ from "lodash";
import { Duration } from "luxon";
import { TextEditor, TextEditorVisibleRangesChangeEvent, window } from "vscode";
import { DoctorUtils } from "./components/doctor/utils";
import { PreviewProxy } from "./components/views/PreviewProxy";
import { IDendronExtension } from "./dendronExtensionInterface";
import { ExtensionProvider } from "./ExtensionProvider";
import { debouncedUpdateDecorations } from "./features/windowDecorations";
import { Logger } from "./logger";
import { AnalyticsUtils, sentryReportingCallback } from "./utils/analytics";
import { ExtensionUtils } from "./utils/ExtensionUtils";

const trackScrolled = _.debounce(() => {
  AnalyticsUtils.track(EngagementEvents.NoteScrolled, {
    noteScrolledSource: NoteScrolledSource.EDITOR,
  });
}, 2500);

/**
 * See [[Window Watcher|dendron://dendron.docs/pkg.plugin-core.ref.window-watcher]] for docs
 */
export class WindowWatcher {
  private _extension: IDendronExtension;
  private _preview: PreviewProxy;

  constructor({
    extension,
    previewProxy,
  }: {
    extension: IDendronExtension;
    previewProxy: PreviewProxy;
  }) {
    this._extension = extension;
    this._preview = previewProxy;
  }

  activate() {
    const context = this._extension.context;

    // provide logging whenever window changes
    this._extension.addDisposable(
      window.onDidChangeVisibleTextEditors(
        sentryReportingCallback((editors: readonly TextEditor[]) => {
          const ctx = "WindowWatcher:onDidChangeVisibleTextEditors";
          const editorPaths = editors.map((editor) => {
            return editor.document.uri.fsPath;
          });
          Logger.info({ ctx, editorPaths });
        })
      )
    );
    this._extension.addDisposable(
      window.onDidChangeActiveTextEditor(
        this.onDidChangeActiveTextEditor,
        this,
        context.subscriptions
      )
    );
    this._extension.addDisposable(
      window.onDidChangeTextEditorVisibleRanges(
        this.onDidChangeTextEditorVisibleRanges,
        this,
        context.subscriptions
      )
    );
  }

  private onDidChangeActiveTextEditor = sentryReportingCallback(
    async (editor: TextEditor | undefined) => {
      const ctx = "WindowWatcher:onDidChangeActiveTextEditor";
      if (
        !editor ||
        editor.document.uri.fsPath !==
          window.activeTextEditor?.document.uri.fsPath ||
        // ignore text editors like the output window
        editor.document.uri.scheme !== "file"
      ) {
        return;
      }

      // check and prompt duplicate warning.
      DoctorUtils.findDuplicateNoteAndPromptIfNecessary(
        editor.document,
        "onDidChangeActiveTextEditor"
      );

      // TODO: changing this to `this._extension.wsUtils.` will fails some tests that
      // mock the extension. Change once that is fixed.
      const note = await ExtensionProvider.getWSUtils().getNoteFromDocument(
        editor.document
      );
      if (_.isUndefined(note)) {
        return;
      }

      Logger.info({ ctx, editor: editor.document.uri.fsPath });

      this.triggerUpdateDecorations(editor);

      // If automatically show preview is enabled, then open the preview
      // whenever text editor changed, as long as it's not already opened:
      // const config = await this._extension.getDWorkspace().config;
      const { wsRoot } = this._extension.getDWorkspace();
      const configReadResult = await ConfigService.instance().readConfig(
        URI.file(wsRoot)
      );
      if (configReadResult.isErr()) {
        throw configReadResult.error;
      }
      const config = configReadResult.value;

      if (config.preview?.automaticallyShowPreview) {
        if (!this._preview.isOpen()) {
          await this._preview.show();
        }
      }

      // If the opened note is still the active text editor 5 seconds after
      // opening, then count it as a valid 'viewed' event
      setTimeout(() => {
        if (
          editor.document.uri.fsPath ===
          window.activeTextEditor?.document.uri.fsPath
        ) {
          const now = Time.now().toMillis();

          const daysSinceCreated = Math.round(
            Duration.fromMillis(now - note.created).as("days")
          );

          const daysSinceUpdated = Math.round(
            Duration.fromMillis(now - note.updated).as("days")
          );

          AnalyticsUtils.track(EngagementEvents.NoteViewed, {
            daysSinceCreation: daysSinceCreated,
            daysSinceUpdate: daysSinceUpdated,
          });
        }
      }, 5000);
    }
  );

  private onDidChangeTextEditorVisibleRanges = sentryReportingCallback(
    async (e: TextEditorVisibleRangesChangeEvent | undefined) => {
      const editor = e?.textEditor;
      const ctx = "WindowWatcher:onDidChangeTextEditorVisibleRanges";
      if (!editor) {
        Logger.info({ ctx, editor: "undefined" });
        return;
      }
      const uri = editor.document.uri;
      const ws = this._extension.getDWorkspace();
      const { wsRoot } = ws;
      const vaults = await ws.vaults;
      if (
        !WorkspaceUtils.isPathInWorkspace({ fpath: uri.fsPath, vaults, wsRoot })
      ) {
        return;
      }
      Logger.debug({ ctx, editor: uri.fsPath });

      // check if its a note and we should update decorators
      const note = await ExtensionProvider.getWSUtils().getNoteFromDocument(
        editor.document
      );
      if (_.isUndefined(note)) {
        return;
      }

      // Decorations only render the visible portions of the screen, so they
      // need to be re-rendered when the user scrolls around
      this.triggerUpdateDecorations(editor);
      if (
        editor.document.uri.fsPath ===
          window.activeTextEditor?.document.uri.fsPath &&
        ExtensionUtils.getTutorialIds().has(note.id)
      ) {
        trackScrolled();
      }
    }
  );

  /**
   * Decorate wikilinks, user tags etc. as well as warning about some issues like missing frontmatter
   */
  async triggerUpdateDecorations(editor: TextEditor) {
    if (!editor) return;
    // This may be the active editor, but could be another editor that's open side by side without being selected.
    // Also, debouncing this based on the editor URI so that decoration updates in different editors don't affect each other but updates don't trigger too often for the same editor
    debouncedUpdateDecorations.debouncedFn(editor);
    return;
  }

  // eslint-disable-next-line camelcase
  __DO_NOT_USE_IN_PROD_exposePropsForTesting() {
    return {
      onDidChangeActiveTextEditor: this.onDidChangeActiveTextEditor.bind(this),
    };
  }
}
