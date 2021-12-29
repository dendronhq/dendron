import {
  ContextualUIEvents,
  DNodeUtils,
  NoteProps,
  NoteUtils,
  Time,
  VaultUtils,
  SchemaUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import {
  ExtensionContext,
  FileRenameEvent,
  FileWillRenameEvent,
  Range,
  TextDocument,
  TextDocumentChangeEvent,
  TextDocumentSaveReason,
  TextDocumentWillSaveEvent,
  TextEdit,
  window,
  workspace,
} from "vscode";
import { Logger } from "./logger";
import { NoteSyncService } from "./services/NoteSyncService";
import {
  getExtension,
  getDWorkspace,
  DendronExtension,
  getVaultFromUri,
} from "./workspace";
import * as Sentry from "@sentry/node";
import { FileWatcher } from "./fileWatcher";
import { file2Note, vault2Path } from "@dendronhq/common-server";
import { AnalyticsUtils } from "./utils/analytics";
import { ISchemaSyncService } from "./services/SchemaSyncServiceInterface";

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

/**
 * See [[Workspace Watcher|dendron://dendron.docs/pkg.plugin-core.ref.workspace-watcher]] for more docs
 */
export class WorkspaceWatcher {
  /** The documents that have been opened during this session that have not been viewed yet in the editor. */
  private _openedDocuments: Map<string, TextDocument>;
  private _debouncedOnDidChangeTextDocument: DebouncedFunc<
    (event: TextDocumentChangeEvent) => Promise<void>
  >;
  private _quickDebouncedOnDidChangeTextDocument: DebouncedFunc<
    (event: TextDocumentChangeEvent) => Promise<void>
  >;
  private _schemaSyncService: ISchemaSyncService;

  constructor({
    schemaSyncService,
  }: {
    schemaSyncService: ISchemaSyncService;
  }) {
    this._schemaSyncService = schemaSyncService;
    this._openedDocuments = new Map();
    this._debouncedOnDidChangeTextDocument = _.debounce(
      this.onDidChangeTextDocument,
      200
    );
    this._quickDebouncedOnDidChangeTextDocument = _.debounce(
      this.quickOnDidChangeTextDocument,
      50
    );
  }

  activate(context: ExtensionContext) {
    const extension = getExtension();

    extension.addDisposable(
      workspace.onWillSaveTextDocument(
        this.onWillSaveTextDocument,
        this,
        context.subscriptions
      )
    );

    extension.addDisposable(
      workspace.onDidChangeTextDocument(
        this._debouncedOnDidChangeTextDocument,
        this,
        context.subscriptions
      )
    );
    extension.addDisposable(
      workspace.onDidChangeTextDocument(
        this._quickDebouncedOnDidChangeTextDocument,
        this,
        context.subscriptions
      )
    );

    extension.addDisposable(
      workspace.onDidSaveTextDocument(
        this.onDidSaveTextDocument,
        this,
        context.subscriptions
      )
    );

    // NOTE: currently, this is only used for logging purposes
    if (Logger.isDebug()) {
      extension.addDisposable(
        workspace.onDidOpenTextDocument(
          this.onDidOpenTextDocument,
          this,
          context.subscriptions
        )
      );
    }

    extension.addDisposable(
      workspace.onWillRenameFiles(
        this.onWillRenameFiles,
        this,
        context.subscriptions
      )
    );

    extension.addDisposable(
      workspace.onDidRenameFiles(
        this.onDidRenameFiles,
        this,
        context.subscriptions
      )
    );
  }

  async onDidSaveTextDocument(document: TextDocument) {
    if (SchemaUtils.isSchemaUri(document.uri)) {
      await this._schemaSyncService.onDidSave({
        document,
      });
    }
  }

  /** This version of `onDidChangeTextDocument` is debounced for a longer time, and is useful for engine changes that should happen more slowly. */
  async onDidChangeTextDocument(event: TextDocumentChangeEvent) {
    try {
      // `workspace.onDidChangeTextDocument` fires 2 events for every change
      // the second one changing the dirty state of the page from `true` to `false`
      if (event.document.isDirty === false) {
        return;
      }

      const ctx = {
        ctx: "WorkspaceWatcher:onDidChangeTextDocument",
        uri: event.document.uri.fsPath,
      };
      Logger.debug({ ...ctx, state: "enter" });
      this._debouncedOnDidChangeTextDocument.cancel();
      const uri = event.document.uri;
      if (!getExtension().workspaceService?.isPathInWorkspace(uri.fsPath)) {
        Logger.debug({ ...ctx, state: "uri not in workspace" });
        return;
      }
      Logger.debug({ ...ctx, state: "trigger change handlers" });
      const contentChanges = event.contentChanges;
      NoteSyncService.instance().onDidChange(event.document, {
        contentChanges,
      });
      Logger.debug({ ...ctx, state: "exit" });
      return;
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  /** This version of `onDidChangeTextDocument` is debounced for a shorter time, and is useful for UI updates that should happen quickly. */
  async quickOnDidChangeTextDocument(event: TextDocumentChangeEvent) {
    try {
      // `workspace.onDidChangeTextDocument` fires 2 events for every change
      // the second one changing the dirty state of the page from `true` to `false`
      if (event.document.isDirty === false) {
        return;
      }

      const ctx = {
        ctx: "WorkspaceWatcher:quickOnDidChangeTextDocument",
        uri: event.document.uri.fsPath,
      };
      Logger.debug({ ...ctx, state: "enter" });
      this._quickDebouncedOnDidChangeTextDocument.cancel();
      const uri = event.document.uri;
      if (!getExtension().workspaceService?.isPathInWorkspace(uri.fsPath)) {
        Logger.debug({ ...ctx, state: "uri not in workspace" });
        return;
      }
      Logger.debug({ ...ctx, state: "trigger change handlers" });
      const activeEditor = window.activeTextEditor;
      if (activeEditor?.document.uri.fsPath === event.document.uri.fsPath) {
        getExtension().windowWatcher?.triggerUpdateDecorations(activeEditor);
      }
      Logger.debug({ ...ctx, state: "exit" });
      return;
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  onDidOpenTextDocument(document: TextDocument) {
    try {
      this._openedDocuments.set(document.uri.fsPath, document);
      Logger.debug({
        msg: "Note opened",
        fname: NoteUtils.uri2Fname(document.uri),
      });
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  async onWillSaveTextDocument(
    event: TextDocumentWillSaveEvent
  ): Promise<{ changes: TextEdit[] }> {
    try {
      const ctx = "WorkspaceWatcher:onWillSaveTextDocument";
      const uri = event.document.uri;
      Logger.info({
        ctx,
        url: uri.fsPath,
        reason: TextDocumentSaveReason[event.reason],
        msg: "enter",
      });
      if (!getExtension().workspaceService?.isPathInWorkspace(uri.fsPath)) {
        Logger.debug({
          ctx,
          uri: uri.fsPath,
          msg: "not in workspace, ignoring.",
        });
        return { changes: [] };
      }

      if (uri.fsPath.endsWith(".md")) {
        return this.onWillSaveNote(event);
      } else {
        Logger.debug({
          ctx,
          uri: uri.fsPath,
          msg: "File type is not registered for updates. ignoring.",
        });
        return { changes: [] };
      }
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  private onWillSaveNote(event: TextDocumentWillSaveEvent) {
    const ctx = "WorkspaceWatcher:onWillSaveNote";
    const uri = event.document.uri;
    const engineClient = getDWorkspace().engine;
    const fname = path.basename(uri.fsPath, ".md");
    const now = Time.now().toMillis();

    const note = NoteUtils.getNoteByFnameV5({
      fname,
      vault: getVaultFromUri(uri),
      notes: engineClient.notes,
      wsRoot: getDWorkspace().wsRoot,
    }) as NoteProps;

    const content = event.document.getText();
    const matchFM = NoteUtils.RE_FM;
    const matchOuter = content.match(matchFM);
    if (!matchOuter) {
      return { changes: [] };
    }
    const match = NoteUtils.RE_FM_UPDATED.exec(content);
    let changes: TextEdit[] = [];

    if (match && parseInt(match[1], 10) !== note.updated) {
      Logger.info({ ctx, match, msg: "update activeText editor" });
      const startPos = event.document.positionAt(match.index);
      const endPos = event.document.positionAt(match.index + match[0].length);
      changes = [
        TextEdit.replace(new Range(startPos, endPos), `updated: ${now}`),
      ];
      // eslint-disable-next-line  no-async-promise-executor
      const p = new Promise(async (resolve) => {
        note.updated = now;
        await engineClient.updateNote(note);
        return resolve(changes);
      });
      event.waitUntil(p);
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

  /**
   * method to make modifications to the workspace before the file is renamed.
   * It updates all the references to the oldUri
   */
  onWillRenameFiles(args: FileWillRenameEvent) {
    // No-op if we're not in a Dendron Workspace
    if (!DendronExtension.isActive()) {
      return;
    }
    try {
      const files = args.files[0];
      const { vaults, wsRoot } = getDWorkspace();
      const { oldUri, newUri } = files;
      const oldVault = VaultUtils.getVaultByFilePath({
        vaults,
        wsRoot,
        fsPath: oldUri.fsPath,
      });
      const oldFname = DNodeUtils.fname(oldUri.fsPath);

      const newVault = VaultUtils.getVaultByFilePath({
        vaults,
        wsRoot,
        fsPath: newUri.fsPath,
      });
      const newFname = DNodeUtils.fname(newUri.fsPath);
      const opts = {
        oldLoc: {
          fname: oldFname,
          vaultName: VaultUtils.getName(oldVault),
        },
        newLoc: {
          fname: newFname,
          vaultName: VaultUtils.getName(newVault),
        },
        isEventSourceEngine: false,
      };
      AnalyticsUtils.track(ContextualUIEvents.ContextualUIRename);
      const engine = getExtension().getEngine();
      const updateNoteReferences = engine.renameNote(opts);
      args.waitUntil(updateNoteReferences);
    } catch (error: any) {
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * method to make modifications to the workspace after the file is renamed.
   * It updates the title of the note wrt the new fname and refreshes tree view
   */
  async onDidRenameFiles(args: FileRenameEvent) {
    // No-op if we're not in a Dendron Workspace
    if (!DendronExtension.isActive()) {
      return;
    }
    try {
      const files = args.files[0];
      const { newUri } = files;
      const fname = DNodeUtils.fname(newUri.fsPath);
      const engine = getExtension().getEngine();
      const { vaults, wsRoot } = getDWorkspace();
      const newVault = VaultUtils.getVaultByFilePath({
        vaults,
        wsRoot,
        fsPath: newUri.fsPath,
      });
      const vpath = vault2Path({ wsRoot, vault: newVault });
      const newLocPath = path.join(vpath, fname + ".md");
      const noteRaw = file2Note(newLocPath, newVault);
      const newNote = NoteUtils.hydrate({
        noteRaw,
        noteHydrated: engine.notes[noteRaw.id],
      });
      newNote.title = NoteUtils.genTitle(fname);
      await engine.writeNote(newNote, { updateExisting: true });
    } catch (error: any) {
      Sentry.captureException(error);
      throw error;
    } finally {
      FileWatcher.refreshTree();
    }
  }
}
