import { NoteProps, NoteUtils, Time, VaultUtils } from "@dendronhq/common-all";
import { genHash } from "@dendronhq/common-server";
import { HistoryService } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import {
  ExtensionContext,
  Range,
  TextDocumentChangeEvent,
  TextDocumentWillSaveEvent,
  TextEdit,
  window,
  workspace,
  TextDocument,
} from "vscode";
import { Logger } from "./logger";
import { DendronWorkspace, getWS } from "./workspace";

export class WorkspaceWatcher {
  activate(context: ExtensionContext) {
    workspace.onWillSaveTextDocument(
      this.onWillSaveTextDocument,
      this,
      context.subscriptions
    );
    workspace.onDidChangeTextDocument(
      this.onDidChangeTextDocument,
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
      DendronWorkspace.instance().windowWatcher?.triggerUpdateDecorations();
    }
    return;
  }

  async onWillSaveTextDocument(
    ev: TextDocumentWillSaveEvent
  ): Promise<{ changes: TextEdit[] }> {
    const ctx = "WorkspaceWatcher:onWillSaveTextDocument";
    const uri = ev.document.uri;
    const reason = ev.reason;
    Logger.info({ ctx, url: uri.fsPath, reason, msg: "enter" });
    if (!getWS().workspaceService?.isPathInWorkspace(uri.fsPath)) {
      Logger.debug({ ctx, uri: uri.fsPath, msg: "not in workspace, ignoring" });
      return { changes: [] };
    }
    const eclient = DendronWorkspace.instance().getEngine();
    const fname = path.basename(uri.fsPath, ".md");
    const now = Time.now().toMillis();
    const vault = VaultUtils.getVaultByNotePath({
      fsPath: uri.fsPath,
      vaults: eclient.vaults,
      wsRoot: DendronWorkspace.wsRoot(),
    });
    const note = NoteUtils.getNoteByFnameV5({
      fname,
      vault,
      notes: eclient.notes,
      wsRoot: DendronWorkspace.wsRoot(),
    }) as NoteProps;

    // if recently changed, ignore
    const recentEvents = HistoryService.instance().lookBack();
    if (recentEvents[0].uri?.fsPath === uri.fsPath) {
      let lastUpdated: string | number = note?.updated || now;
      if (_.isString(lastUpdated)) {
        lastUpdated = _.parseInt(lastUpdated);
      }
      if (now - lastUpdated < 1 * 3e3) {
        return { changes: [] };
      }
    }

    const content = ev.document.getText();
    const matchFM = NoteUtils.RE_FM;
    const matchOuter = content.match(matchFM);
    if (!matchOuter) {
      return { changes: [] };
    }
    const match = NoteUtils.RE_FM_UPDATED.exec(content);
    const noteHash = genHash(content);
    let changes: TextEdit[] = [];
    if (match && note.contentHash && note.contentHash !== noteHash) {
      Logger.info({ ctx, match, msg: "update activeText editor" });
      const startPos = ev.document.positionAt(match.index);
      const endPos = ev.document.positionAt(match.index + match[0].length);
      changes = [
        TextEdit.replace(new Range(startPos, endPos), `updated: ${now}`),
      ];
      const p = new Promise(async (resolve) => {
        note.updated = now;
        await eclient.updateNote(note);
        return resolve(changes);
      });
      ev.waitUntil(p);
    }
    return { changes };
  }

  onDidOpenTextDocument(document: TextDocument) {
    this._openedDocuments.set(document.uri.fsPath, document);
  }

  /** The documents that have been opened during this session that have not been viewed yet in the editor.
   *
   * Had to add undefined because
   */
  private _openedDocuments: Map<string, TextDocument> = new Map();

  /** Do not use this function, please go to `WindowWatcher.onFirstOpen() instead.`
   *
   * Checks if the given document has been opened for the first time during this session, and marks the document as being processed.
   *
   * Certain actions (such as folding and adjusting the cursor) need to be done only the first time a document is opened.
   * While the `WorkspaceWatcher` sees when new documents are opened, the `TextEditor` is not active at that point, and we can not
   * perform these actions. This code allows `WindowWatcher` to check when an editor becomes active whether that editor belongs to an newly opened document.
   *
   * Mind that this method is not idempotent, checking the same document twice will always return false for the second time.
   */
  public getNewlyOpenedDocument(document: TextDocument): boolean {
    const key = document.uri.fsPath;
    if (this._openedDocuments?.has(key)) {
      this._openedDocuments.delete(key);
      return true;
    }
    return false;
  }
}
