import {
  ConfigUtils,
  DendronWebViewKey,
  DMessageType,
  NoteUtils,
  OnDidChangeActiveTextEditorMsg,
} from "@dendronhq/common-all";
import { DendronASTDest, MDUtilsV5 } from "@dendronhq/engine-server";
import _ from "lodash";
import visit from "unist-util-visit";
import { ExtensionContext, Selection, TextEditor, window } from "vscode";
import { ShowPreviewCommand } from "./commands/ShowPreview";
import { updateDecorations } from "./features/windowDecorations";
import { Logger } from "./logger";
import { VSCodeUtils } from "./utils";
import { sentryReportingCallback } from "./utils/analytics";
import { getDWorkspace, getExtension } from "./workspace";

const context = (scope: string) => {
  const ROOT_CTX = "WindowWatcher";
  return ROOT_CTX + ":" + scope;
};
export class WindowWatcher {
  private onDidChangeActiveTextEditorHandlers: ((
    e: TextEditor | undefined
  ) => void)[] = [];

  activate(context: ExtensionContext) {
    window.onDidChangeVisibleTextEditors(
      sentryReportingCallback((editors: TextEditor[]) => {
        const ctx = "WindowWatcher:onDidChangeVisibleTextEditors";
        const editorPaths = editors.map((editor) => {
          return editor.document.uri.fsPath;
        });
        Logger.info({ ctx, editorPaths });
      })
    );
    window.onDidChangeActiveTextEditor(
      this.onDidChangeActiveTextEditor,
      this,
      context.subscriptions
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
        Logger.info({ ctx, editor: uri.fsPath });
        if (!getExtension().workspaceService?.isPathInWorkspace(uri.fsPath)) {
          Logger.info({ ctx, uri: uri.fsPath, msg: "not in workspace" });
          return;
        }
        this.triggerUpdateDecorations();
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

  /**
   * Add text decorator to frontmatter
   * @returns
   */
  async triggerUpdateDecorations() {
    const activeEditor = window.activeTextEditor;
    if (!activeEditor) {
      return;
    }

    updateDecorations(activeEditor);
    return;
  }

  async triggerNoteGraphViewUpdate() {
    const noteGraphPanel = getExtension().getWebView(
      DendronWebViewKey.NOTE_GRAPH
    );
    if (!_.isUndefined(noteGraphPanel)) {
      if (noteGraphPanel.visible) {
        // TODO Logic here + test

        const activeEditor = window.activeTextEditor;
        if (!activeEditor) {
          return;
        }

        const note = VSCodeUtils.getNoteFromDocument(activeEditor.document);

        noteGraphPanel.webview.postMessage({
          type: DMessageType.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
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
      DendronWebViewKey.SCHEMA_GRAPH
    );
    if (!_.isUndefined(schemaGraphPanel)) {
      if (schemaGraphPanel.visible) {
        // TODO Logic here + test

        const activeEditor = window.activeTextEditor;
        if (!activeEditor) {
          return;
        }

        const note = VSCodeUtils.getNoteFromDocument(activeEditor.document);

        schemaGraphPanel.webview.postMessage({
          type: DMessageType.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
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
    ShowPreviewCommand.onDidChangeHandler(document);
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
