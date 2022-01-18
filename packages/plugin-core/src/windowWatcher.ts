import { WorkspaceUtils } from "@dendronhq/engine-server";
import { TextEditor, TextEditorVisibleRangesChangeEvent, window } from "vscode";
import { ShowPreviewCommand } from "./commands/ShowPreview";
import { IDendronExtension } from "./dendronExtensionInterface";
import { debouncedUpdateDecorations } from "./features/windowDecorations";
import { Logger } from "./logger";
import { sentryReportingCallback } from "./utils/analytics";

/**
 * See [[Window Watcher|dendron://dendron.docs/pkg.plugin-core.ref.window-watcher]] for docs
 */
export class WindowWatcher {
  private onDidChangeActiveTextEditorHandlers: ((
    e: TextEditor | undefined
  ) => void)[] = [];

  private _extension: IDendronExtension;

  constructor(extension: IDendronExtension) {
    this._extension = extension;
  }

  activate() {
    const context = this._extension.context;

    // provide logging whenever window changes
    this._extension.addDisposable(
      window.onDidChangeVisibleTextEditors(
        sentryReportingCallback((editors: TextEditor[]) => {
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

  registerActiveTextEditorChangedHandler(
    handler: (e: TextEditor | undefined) => void
  ) {
    this.onDidChangeActiveTextEditorHandlers.push(handler);
  }

  private onDidChangeActiveTextEditor = sentryReportingCallback(
    (editor: TextEditor | undefined) => {
      const ctx = "WindowWatcher:onDidChangeActiveTextEditor";
      if (
        editor &&
        editor.document.uri.fsPath ===
          window.activeTextEditor?.document.uri.fsPath
      ) {
        const uri = editor.document.uri;
        this.triggerNotePreviewUpdate(editor);
        if (!this._extension.workspaceService?.isPathInWorkspace(uri.fsPath)) {
          return;
        }
        Logger.info({ ctx, editor: uri.fsPath });
        this.triggerUpdateDecorations(editor);

        // other components can register handlers for window watcher
        // those handlers get called here
        this.onDidChangeActiveTextEditorHandlers.forEach((value) =>
          value.call(this, editor)
        );
      } else {
        Logger.info({ ctx, editor: "undefined" });
      }
    }
  );

  private onDidChangeTextEditorVisibleRanges = sentryReportingCallback(
    (e: TextEditorVisibleRangesChangeEvent | undefined) => {
      const editor = e?.textEditor;
      const ctx = "WindowWatcher:onDidChangeTextEditorVisibleRanges";
      if (!editor) {
        Logger.info({ ctx, editor: "undefined" });
        return;
      }
      const uri = editor.document.uri;
      const { vaults, wsRoot } = this._extension.getDWorkspace();
      if (
        !WorkspaceUtils.isPathInWorkspace({ fpath: uri.fsPath, vaults, wsRoot })
      ) {
        return;
      }
      Logger.info({ ctx, editor: uri.fsPath });
      // Decorations only render the visible portions of the screen, so they
      // need to be re-rendered when the user scrolls around
      this.triggerUpdateDecorations(editor);
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

  /**
   * Show note preview panel if applicable
   */
  triggerNotePreviewUpdate({ document }: TextEditor) {
    return ShowPreviewCommand.openDocumentInPreview(document);
  }
}
