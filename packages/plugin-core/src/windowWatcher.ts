import { ConfigUtils, NoteUtils } from "@dendronhq/common-all";
import { RemarkUtils, WorkspaceUtils } from "@dendronhq/engine-server";

import _ from "lodash";
import {
  ExtensionContext,
  Selection,
  TextEditor,
  TextEditorVisibleRangesChangeEvent,
  window,
} from "vscode";
import { PreviewProxy } from "./components/views/PreviewViewFactory";
import { debouncedUpdateDecorations } from "./features/windowDecorations";
import { Logger } from "./logger";
import { sentryReportingCallback } from "./utils/analytics";
import { VSCodeUtils } from "./vsCodeUtils";
import { getDWorkspace, getExtension } from "./workspace";
import { WSUtils } from "./WSUtils";

const context = (scope: string) => {
  const ROOT_CTX = "WindowWatcher";
  return ROOT_CTX + ":" + scope;
};

/**
 * See [[Window Watcher|dendron://dendron.docs/pkg.plugin-core.ref.window-watcher]] for docs
 */
export class WindowWatcher {
  private _previewProxy: PreviewProxy;

  constructor(previewProxy: PreviewProxy) {
    this._previewProxy = previewProxy;
  }

  private onDidChangeActiveTextEditorHandlers: ((
    e: TextEditor | undefined
  ) => void)[] = [];

  activate(context: ExtensionContext) {
    const extension = getExtension();

    // provide logging whenever window changes
    extension.addDisposable(
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
    extension.addDisposable(
      window.onDidChangeActiveTextEditor(
        this.onDidChangeActiveTextEditor,
        this,
        context.subscriptions
      )
    );
    extension.addDisposable(
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
        if (!getExtension().workspaceService?.isPathInWorkspace(uri.fsPath)) {
          return;
        }
        Logger.info({ ctx, editor: uri.fsPath });
        this.triggerUpdateDecorations(editor);
        this.triggerNotePreviewUpdate(editor);

        // other components can register handlers for window watcher
        // those handlers get called here
        this.onDidChangeActiveTextEditorHandlers.forEach((value) =>
          value.call(this, editor)
        );

        // we have custom logic for newly opened documents
        if (
          getExtension().workspaceWatcher?.getNewlyOpenedDocument(
            editor.document
          )
        ) {
          this.onFirstOpen(editor);
        }
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
      const { vaults, wsRoot } = getDWorkspace();
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
    const maybeNote = WSUtils.tryGetNoteFromDocument(document);
    if (maybeNote) {
      this._previewProxy.showPreviewAndUpdate(maybeNote);
    }

    return;
  }

  private async onFirstOpen(editor: TextEditor) {
    Logger.info({
      ctx: context("onFirstOpen"),
      msg: "enter",
      fname: NoteUtils.uri2Fname(editor.document.uri),
    });
    this.moveCursorPastFrontmatter(editor);
    const config = getDWorkspace().config;
    if (ConfigUtils.getWorkspace(config).enableAutoFoldFrontmatter) {
      await this.foldFrontmatter();
    }
    Logger.info({
      ctx: context("onFirstOpen"),
      msg: "exit",
      fname: NoteUtils.uri2Fname(editor.document.uri),
    });
  }

  private moveCursorPastFrontmatter(editor: TextEditor) {
    const nodePosition = RemarkUtils.getNodePositionPastFrontmatter(
      editor.document.getText()
    );
    if (!_.isUndefined(nodePosition)) {
      const position = VSCodeUtils.point2VSCodePosition(nodePosition.end, {
        line: 1,
      });
      editor.selection = new Selection(position, position);
    }
  }

  private async foldFrontmatter() {
    await VSCodeUtils.foldActiveEditorAtPosition({ line: 0 });
  }
}
