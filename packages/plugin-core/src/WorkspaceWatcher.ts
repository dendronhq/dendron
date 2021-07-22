import { NoteProps, NoteUtils, Time, VaultUtils } from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import {
  ExtensionContext,
  Range,
  TextDocument,
  TextDocumentChangeEvent,
  TextDocumentWillSaveEvent,
  TextEdit,
  window,
  workspace,
} from "vscode";
import { Logger } from "./logger";
import { NoteSyncService } from "./services/NoteSyncService";
import { DendronWorkspace, getWS } from "./workspace";

interface DebouncedFunc<T extends (...args: any[]) => any> {
  /**
   * Call the original function, but applying the debounce rules.
   *
   * If the debounced function can be run immediately, this calls it and returns its return
   * value.
   *
   * Otherwise, it returns the return value of the last invokation, or undefined if the debounced
   * function was not invoked yet.
   */
  (...args: Parameters<T>): ReturnType<T> | undefined;

  /**
   * Throw away any pending invokation of the debounced function.
   */
  cancel(): void;

  /**
   * If there is a pending invokation of the debounced function, invoke it immediately and return
   * its return value.
   *
   * Otherwise, return the value from the last invokation, or undefined if the debounced function
   * was never invoked.
   */
  flush(): ReturnType<T> | undefined;
}

export class WorkspaceWatcher {
  /** The documents that have been opened during this session that have not been viewed yet in the editor. */
  private _openedDocuments: Set<string> = new Set<string>();
  private _debouncedOnDidChangeTextDocument: DebouncedFunc<
    (event: TextDocumentChangeEvent) => Promise<void>
  >;

  constructor() {
    this._debouncedOnDidChangeTextDocument = _.debounce(
      this.onDidChangeTextDocument,
      100
    );
  }

  activate(context: ExtensionContext) {
    workspace.onWillSaveTextDocument(
      this.onWillSaveTextDocument,
      this,
      context.subscriptions
    );

    workspace.onDidChangeTextDocument(
      this._debouncedOnDidChangeTextDocument,
      this,
      context.subscriptions
    );

    // NOTE: currently, this is only used for logging purposes
    if (Logger.isDebug()) {
      workspace.onDidOpenTextDocument(
        this.onDidOpenTextDocument,
        this,
        context.subscriptions
      );
    }
  }

  async onDidChangeTextDocument(event: TextDocumentChangeEvent) {
    // `workspace.onDidChangeTextDocument` fires 2 events for eveyr change
    // the second one changing the dirty state of the page from `true` to `false`
    if (event.document.isDirty === false) {
      return;
    }
    const activeEditor = window.activeTextEditor;
    this._debouncedOnDidChangeTextDocument.cancel();
    if (activeEditor && event.document === activeEditor.document) {
      const uri = activeEditor.document.uri;
      if (!getWS().workspaceService?.isPathInWorkspace(uri.fsPath)) {
        return;
      }
      const contentChanges = event.contentChanges;
      DendronWorkspace.instance().windowWatcher?.triggerUpdateDecorations();
      NoteSyncService.instance().onDidChange(activeEditor, { contentChanges });
    }
    return;
  }

  onDidOpenTextDocument(document: TextDocument) {
    this._openedDocuments.add(document.uri.fsPath);
    Logger.debug({
      msg: "Note opened",
      fname: NoteUtils.uri2Fname(document.uri),
    });
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

    const content = ev.document.getText();
    const matchFM = NoteUtils.RE_FM;
    const matchOuter = content.match(matchFM);
    if (!matchOuter) {
      return { changes: [] };
    }
    const match = NoteUtils.RE_FM_UPDATED.exec(content);
    let changes: TextEdit[] = [];

    if (match && parseInt(match[1], 10) !== note.updated) {
      Logger.info({ ctx, match, msg: "update activeText editor" });
      const startPos = ev.document.positionAt(match.index);
      const endPos = ev.document.positionAt(match.index + match[0].length);
      changes = [
        TextEdit.replace(new Range(startPos, endPos), `updated: ${now}`),
      ];
      // eslint-disable-next-line  no-async-promise-executor
      const p = new Promise(async (resolve) => {
        note.updated = now;
        await eclient.updateNote(note);
        return resolve(changes);
      });
      ev.waitUntil(p);
    }
    return { changes };
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
