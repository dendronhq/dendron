import {
  DendronWebViewKey,
  DMessageType,
  NoteUtils,
  OnDidChangeActiveTextEditorMsg
} from "@dendronhq/common-all";
import { DendronASTDest, MDUtilsV5 } from "@dendronhq/engine-server";
import _ from "lodash";
import visit from "unist-util-visit";
import { ExtensionContext, Selection, TextEditor, window } from "vscode";
import { ShowPreviewV2Command } from "./commands/ShowPreviewV2";
import { updateDecorations } from "./features/windowDecorations";
import { Logger } from "./logger";
import { VSCodeUtils } from "./utils";
import { getWS } from "./workspace";

export class WindowWatcher {
  private onDidChangeActiveTextEditorHandlers: ((e: TextEditor | undefined) => void)[] = [];

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

  registerActiveTextEditorChangedHandler(handler:(e: TextEditor | undefined) => void) {
    this.onDidChangeActiveTextEditorHandlers.push(handler);
  }

  private onDidChangeActiveTextEditor = (editor: TextEditor | undefined) => {
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

      this.onDidChangeActiveTextEditorHandlers.forEach(value => value.call(this, editor));

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
    ShowPreviewV2Command.onDidChangeHandler(document);
    return;
  }

  /** When these files are opened for the first time, the cursor shouldn't get moved automatically.
   * This is useful if we're about to open a file and move the cursor somewhere in Dendron.
   */
  private dontMoveCursorFiles = new Set<string>();
  public dontMoveCursorOnFirstOpen(fsPath: string) {
    this.dontMoveCursorFiles.add(fsPath);
  }

  private async onFirstOpen(editor: TextEditor) {
    Logger.info({
      msg: "First open of note",
      fname: NoteUtils.uri2Fname(editor.document.uri),
    });

    const dontMoveThisFile = this.dontMoveCursorFiles.delete(editor.document.uri.fsPath);
    if (!dontMoveThisFile) {
      this.moveCursorPastFrontmatter(editor);
    }

    if (getWS().config.autoFoldFrontmatter) {
      await this.foldFrontmatter();
    }
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
