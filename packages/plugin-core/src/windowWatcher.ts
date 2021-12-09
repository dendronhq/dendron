import {
  ConfigUtils,
  DendronEditorViewKey,
  DMessageEnum,
  NoteUtils,
  OnDidChangeActiveTextEditorMsg,
} from "@dendronhq/common-all";
import { DendronASTDest, MDUtilsV5 } from "@dendronhq/engine-server";
import _ from "lodash";
import visit from "unist-util-visit";
import {
  ExtensionContext,
  Selection,
  TextEditor,
  TextEditorVisibleRangesChangeEvent,
  window,
} from "vscode";
import { debouncedUpdateDecorations } from "./features/windowDecorations";
import { Logger } from "./logger";
import { sentryReportingCallback } from "./utils/analytics";
import { PreviewUtils } from "./views/utils";
import { VSCodeUtils } from "./vsCodeUtils";
import { getDWorkspace, getExtension } from "./workspace";
import { WSUtils } from "./WSUtils";

const context = (scope: string) => {
  const ROOT_CTX = "WindowWatcher";
  return ROOT_CTX + ":" + scope;
};
export class WindowWatcher {
  private onDidChangeActiveTextEditorHandlers: ((
    e: TextEditor | undefined
  ) => void)[] = [];

  activate(context: ExtensionContext) {
    const extension = getExtension();

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
        this.triggerNoteGraphViewUpdate();
        this.triggerSchemaGraphViewUpdate();
        this.triggerNotePreviewUpdate(editor);

        this.onDidChangeActiveTextEditorHandlers.forEach((value) =>
          value.call(this, editor)
        );

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
      if (!getExtension().workspaceService?.isPathInWorkspace(uri.fsPath)) {
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

  async triggerNoteGraphViewUpdate() {
    const noteGraphPanel = getExtension().getWebView(
      DendronEditorViewKey.NOTE_GRAPH
    );
    if (!_.isUndefined(noteGraphPanel)) {
      if (noteGraphPanel.visible) {
        // TODO Logic here + test

        const activeEditor = window.activeTextEditor;
        if (!activeEditor) {
          return;
        }

        const note = WSUtils.getNoteFromDocument(activeEditor.document);

        noteGraphPanel.webview.postMessage({
          type: DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
          data: {
            note,
            sync: true,
          },
          source: "vscode",
        } as OnDidChangeActiveTextEditorMsg);
      }
    }
    return;
  }
  async triggerSchemaGraphViewUpdate() {
    const schemaGraphPanel = getExtension().getWebView(
      DendronEditorViewKey.SCHEMA_GRAPH
    );
    if (!_.isUndefined(schemaGraphPanel)) {
      if (schemaGraphPanel.visible) {
        // TODO Logic here + test

        const activeEditor = window.activeTextEditor;
        if (!activeEditor) {
          return;
        }

        const note = WSUtils.getNoteFromDocument(activeEditor.document);

        schemaGraphPanel.webview.postMessage({
          type: DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
          data: {
            note,
            sync: true,
          },
          source: "vscode",
        } as OnDidChangeActiveTextEditorMsg);
      }
    }
    return;
  }

  async triggerNotePreviewUpdate({ document }: TextEditor) {
    PreviewUtils.onDidChangeHandler(document);
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
    const proc = MDUtilsV5.procRemarkParseNoData(
      {},
      { dest: DendronASTDest.MD_DENDRON }
    );
    const parsed = proc.parse(editor.document.getText());
    visit(parsed, ["yaml"], (node) => {
      if (_.isUndefined(node.position)) return false; // Should never happen
      const position = VSCodeUtils.point2VSCodePosition(
        node.position.end,
        // Move past frontmatter + one line after the end because otherwise this ends up inside frontmatter when folded.
        // This also makes sense because the front
        { line: 1 }
      );
      editor.selection = new Selection(position, position);
      // Found the frontmatter already, stop traversing
      return false;
    });
  }

  private async foldFrontmatter() {
    await VSCodeUtils.foldActiveEditorAtPosition({ line: 0 });
  }
}
