import {
  DendronWebViewKey,
  NoteUtils,
  OnDidChangeActiveTextEditorMsg,
} from "@dendronhq/common-all";
import _ from "lodash";
import { ExtensionContext, window, TextEditor, Selection } from "vscode";
import { Logger } from "./logger";
import { VSCodeUtils } from "./utils";
import { getWS } from "./workspace";
import { ShowPreviewV2Command } from "./commands/ShowPreviewV2";
import visit from "unist-util-visit";
import { DendronASTDest, MDUtilsV5, ProcMode } from "@dendronhq/engine-server";
import { updateDecorations } from "./features/windowDecorations";

export class WindowWatcher {
  activate(context: ExtensionContext) {
    window.onDidChangeVisibleTextEditors((editors) => {
      const ctx = "WindowWatcher:onDidChangeVisibleTextEditors";
      const editorPaths = editors.map((editor) => {
        return editor.document.uri.fsPath;
      });
      Logger.info({ ctx, editorPaths });
    });
    window.onDidChangeActiveTextEditor(
      this.onDidChangeActiveTextEditor,
      this,
      context.subscriptions
    );
  }

  onDidChangeActiveTextEditor = (editor: TextEditor | undefined) => {
    const ctx = "WindowWatcher:onDidChangeActiveTextEditor";
    if (
      editor &&
      editor.document.uri.fsPath ===
        window.activeTextEditor?.document.uri.fsPath
    ) {
      const uri = editor.document.uri;
      Logger.info({ ctx, editor: uri.fsPath });
      if (!getWS().workspaceService?.isPathInWorkspace(uri.fsPath)) {
        Logger.info({ ctx, uri: uri.fsPath, msg: "not in workspace" });
        return;
      }
      this.triggerUpdateDecorations();
      this.triggerNoteGraphViewUpdate();
      this.triggerSchemaGraphViewUpdate();
      this.triggerNotePreviewUpdate(editor);

      if (getWS().workspaceWatcher?.getNewlyOpenedDocument(editor.document)) {
        this.onFirstOpen(editor);
      }
    } else {
      Logger.info({ ctx, editor: "undefined" });
    }
  };

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
    const noteGraphPanel = getWS().getWebView(DendronWebViewKey.NOTE_GRAPH);
    if (!_.isUndefined(noteGraphPanel)) {
      if (noteGraphPanel.visible) {
        // TODO Logic here + test

        const activeEditor = window.activeTextEditor;
        if (!activeEditor) {
          return;
        }

        const note = VSCodeUtils.getNoteFromDocument(activeEditor.document);

        noteGraphPanel.webview.postMessage({
          type: "onDidChangeActiveTextEditor",
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
    const schemaGraphPanel = getWS().getWebView(DendronWebViewKey.SCHEMA_GRAPH);
    if (!_.isUndefined(schemaGraphPanel)) {
      if (schemaGraphPanel.visible) {
        // TODO Logic here + test

        const activeEditor = window.activeTextEditor;
        if (!activeEditor) {
          return;
        }

        const note = VSCodeUtils.getNoteFromDocument(activeEditor.document);

        schemaGraphPanel.webview.postMessage({
          type: "onDidChangeActiveTextEditor",
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
    ShowPreviewV2Command.onDidChangeHandler(document);
    return;
  }

  private async onFirstOpen(editor: TextEditor) {
    Logger.info({
      msg: "First open of note",
      fname: NoteUtils.uri2Fname(editor.document.uri),
    });
    this.moveCursorPastFrontmatter(editor);
    if (getWS().config.autoFoldFrontmatter) {
      await this.foldFrontmatter();
    }
  }

  private moveCursorPastFrontmatter(editor: TextEditor) {
    const proc = MDUtilsV5.procRemarkParse(
      {
        mode: ProcMode.NO_DATA,
        parseOnly: true,
      },
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
