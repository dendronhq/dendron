import { NoteUtils } from "@dendronhq/common-all";
import _ from "lodash";
import {
  ExtensionContext,
  TextDocument,
  TextDocumentChangeEvent,
  window,
  workspace,
} from "vscode";
import { Logger } from "./logger";
import { NoteSyncService } from "./services/NoteSyncService";
import { DendronWorkspace, getWS } from "./workspace";

export class WorkspaceWatcher {
  /** The documents that have been opened during this session that have not been viewed yet in the editor. */
  private _openedDocuments: Map<string, TextDocument>;

  constructor() {
    this._openedDocuments = new Map();
  }

  activate(context: ExtensionContext) {
    workspace.onDidChangeTextDocument(
      _.debounce(this.onDidChangeTextDocument, 100),
      this,
      context.subscriptions
    );
    workspace.onDidOpenTextDocument(
      this.onDidOpenTextDocument,
      this,
      context.subscriptions
    );
  }

  async onDidChangeTextDocument(event: TextDocumentChangeEvent) {
    const activeEditor = window.activeTextEditor;
    if (activeEditor && event.document === activeEditor.document) {
      const uri = activeEditor.document.uri;
      if (!getWS().workspaceService?.isPathInWorkspace(uri.fsPath)) {
        return;
      }
      DendronWorkspace.instance().windowWatcher?.triggerUpdateDecorations();
      NoteSyncService.instance().onDidChange(activeEditor.document.uri);
    }
    return;
  }

  onDidOpenTextDocument(document: TextDocument) {
    this._openedDocuments.set(document.uri.fsPath, document);
    Logger.debug({
      msg: "Note opened",
      fname: NoteUtils.uri2Fname(document.uri),
    });
  }

  /** Do not use this function, please go to `WindowWatcher.onFirstOpen() instead.`
   *
   * Checks if the given document has been opened for the first time during this session, and marks the document as being processed.
   *
   * Certain actions (such as folding and adjusting the cursor) need to be done only the first time a document is opened.
   * While the `WorkspaceWatcher` sees when new documents are opened, the `TextEditor` is not active at that point, and we can not
   * perform these actions. This code allows `WindowWatcher` to check when an editor becomes active whether that editor belongs to an
   * newly opened document.
   *
   * Mind that this method is not idempotent, checking the same document twice will always return false for the second time.
   */
  public getNewlyOpenedDocument(document: TextDocument): boolean {
    const key = document.uri.fsPath;
    if (this._openedDocuments?.has(key)) {
      Logger.debug({
        msg: "Marking note as having opened for the first time this session",
        fname: NoteUtils.uri2Fname(document.uri),
      });
      this._openedDocuments.delete(key);
      return true;
    }
    return false;
  }
}
