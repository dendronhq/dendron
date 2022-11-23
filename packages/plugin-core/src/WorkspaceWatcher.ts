import {
  ConfigUtils,
  ContextualUIEvents,
  DNodeUtils,
  DVault,
  ErrorUtils,
  NoteUtils,
  SchemaUtils,
  Time,
  VaultUtils,
  Wrap,
} from "@dendronhq/common-all";
import { file2Note, vault2Path } from "@dendronhq/common-server";
import { WorkspaceUtils } from "@dendronhq/engine-server";
import { RemarkUtils } from "@dendronhq/unified";
import * as Sentry from "@sentry/node";
import _ from "lodash";
import path from "path";
import {
  ExtensionContext,
  FileRenameEvent,
  FileWillRenameEvent,
  Range,
  Selection,
  TextDocument,
  TextDocumentChangeEvent,
  TextDocumentSaveReason,
  TextDocumentWillSaveEvent,
  TextEdit,
  TextEditor,
  window,
  workspace,
} from "vscode";
import { DoctorUtils } from "./components/doctor/utils";
import { IDendronExtension } from "./dendronExtensionInterface";
import { Logger } from "./logger";
import { ISchemaSyncService } from "./services/SchemaSyncServiceInterface";
import { TextDocumentService } from "./services/node/TextDocumentService";
import { AnalyticsUtils, sentryReportingCallback } from "./utils/analytics";
import { VSCodeUtils } from "./vsCodeUtils";
import { WindowWatcher } from "./windowWatcher";

const MOVE_CURSOR_PAST_FRONTMATTER_DELAY = 50; /* ms */

interface DebouncedFunc<T extends (...args: any[]) => any> {
  /**
   * Call the original function, but applying the debounce rules.
   *
   * If the debounced function can be run immediately, this calls it and returns its return
   * value.
   *
   * Otherwise, it returns the return value of the last invocation, or undefined if the debounced
   * function was not invoked yet.
   */
  (...args: Parameters<T>): ReturnType<T> | undefined;

  /**
   * Throw away any pending invocation of the debounced function.
   */
  cancel(): void;

  /**
   * If there is a pending invocation of the debounced function, invoke it immediately and return
   * its return value.
   *
   * Otherwise, return the value from the last invocation, or undefined if the debounced function
   * was never invoked.
   */
  flush(): ReturnType<T> | undefined;
}

const context = (scope: string) => {
  const ROOT_CTX = "WorkspaceWatcher";
  return ROOT_CTX + ":" + scope;
};

/**
 * See [[Workspace Watcher|dendron://dendron.docs/pkg.plugin-core.ref.workspace-watcher]] for more docs
 */
export class WorkspaceWatcher {
  /** The documents that have been opened during this session that have not been viewed yet in the editor. */
  private _openedDocuments: Map<string, TextDocument>;
  private _quickDebouncedOnDidChangeTextDocument: DebouncedFunc<
    (event: TextDocumentChangeEvent) => Promise<void>
  >;
  private _schemaSyncService: ISchemaSyncService;
  private _extension: IDendronExtension;
  private _windowWatcher: WindowWatcher;

  constructor({
    schemaSyncService,
    extension,
    windowWatcher,
  }: {
    schemaSyncService: ISchemaSyncService;
    extension: IDendronExtension;
    windowWatcher: WindowWatcher;
  }) {
    this._extension = extension;
    this._schemaSyncService = schemaSyncService;
    this._openedDocuments = new Map();
    this._quickDebouncedOnDidChangeTextDocument = _.debounce(
      this.quickOnDidChangeTextDocument,
      50
    );
    this._extension = extension;
    this._windowWatcher = windowWatcher;
  }

  // eslint-disable-next-line camelcase
  __DO_NOT_USE_IN_PROD_exposePropsForTesting() {
    return {
      onFirstOpen: _.bind(this.onFirstOpen, this),
    };
  }

  activate(context: ExtensionContext) {
    this._extension.addDisposable(
      workspace.onWillSaveTextDocument(
        this.onWillSaveTextDocument,
        this,
        context.subscriptions
      )
    );

    this._extension.addDisposable(
      workspace.onDidChangeTextDocument(
        this._quickDebouncedOnDidChangeTextDocument,
        this,
        context.subscriptions
      )
    );

    this._extension.addDisposable(
      workspace.onDidSaveTextDocument(
        this.onDidSaveTextDocument,
        this,
        context.subscriptions
      )
    );

    // NOTE: currently, this is only used for logging purposes
    if (Logger.isDebug()) {
      this._extension.addDisposable(
        workspace.onDidOpenTextDocument(
          this.onDidOpenTextDocument,
          this,
          context.subscriptions
        )
      );
    }

    this._extension.addDisposable(
      workspace.onWillRenameFiles(
        this.onWillRenameFiles,
        this,
        context.subscriptions
      )
    );

    this._extension.addDisposable(
      workspace.onDidRenameFiles(
        this.onDidRenameFiles,
        this,
        context.subscriptions
      )
    );

    this._extension.addDisposable(
      window.onDidChangeActiveTextEditor(
        sentryReportingCallback((editor: TextEditor | undefined) => {
          if (
            editor?.document &&
            this.getNewlyOpenedDocument(editor.document)
          ) {
            this.onFirstOpen(editor);
          }
        }),
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
    } else {
      await this.onDidSaveNote(document);
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
      const ws = this._extension.getDWorkspace();
      const { wsRoot } = ws;
      const vaults = await ws.vaults;
      if (
        !WorkspaceUtils.isPathInWorkspace({
          wsRoot,
          vaults,
          fpath: uri.fsPath,
        })
      ) {
        Logger.debug({ ...ctx, state: "uri not in workspace" });
        return;
      }
      Logger.debug({ ...ctx, state: "trigger change handlers" });
      const activeEditor = window.activeTextEditor;
      if (activeEditor?.document.uri.fsPath === event.document.uri.fsPath) {
        this._windowWatcher.triggerUpdateDecorations(activeEditor);
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
      DoctorUtils.findDuplicateNoteAndPromptIfNecessary(
        document,
        "onDidOpenTextDocument"
      );
      DoctorUtils.validateFilenameFromDocumentAndPromptIfNecessary(document);
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * If note is in workspace, execute {@link onWillSaveNote}
   * @param event
   * @returns
   */
  onWillSaveTextDocument(event: TextDocumentWillSaveEvent) {
    try {
      const ctx = "WorkspaceWatcher:onWillSaveTextDocument";
      const uri = event.document.uri;
      Logger.info({
        ctx,
        url: uri.fsPath,
        reason: TextDocumentSaveReason[event.reason],
        msg: "enter",
      });
      const ws = this._extension.getDWorkspace();
      const { wsRoot } = ws;
      let changes: TextEdit[] = [];
      // eslint-disable-next-line no-async-promise-executor
      const promise = new Promise(async (resolve) => {
        const vaults = await ws.vaults;
        if (
          !WorkspaceUtils.isPathInWorkspace({
            fpath: uri.fsPath,
            wsRoot,
            vaults,
          })
        ) {
          Logger.debug({
            ctx,
            uri: uri.fsPath,
            msg: "not in workspace, ignoring.",
          });
        }
        if (uri.fsPath.endsWith(".md")) {
          changes = this.onWillSaveNote(event).changes;
        } else {
          Logger.debug({
            ctx,
            uri: uri.fsPath,
            msg: "File type is not registered for updates. ignoring.",
          });
          return { changes: [] };
        }
        return resolve(changes);
      });
      event.waitUntil(promise);
      return { changes };
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * When saving a note, do some book keeping
   * - update the `updated` time in frontmatter
   * - update the note metadata in the engine
   *
   * this method needs to be sync since event.WaitUntil can be called
   * in an asynchronous manner.
   * @param event
   * @returns
   */
  private onWillSaveNote(event: TextDocumentWillSaveEvent) {
    const ctx = "WorkspaceWatcher:onWillSaveNote";
    const uri = event.document.uri;
    const engine = this._extension.getEngine();
    const fname = path.basename(uri.fsPath, ".md");
    const now = Time.now().toMillis();
    let changes: TextEdit[] = [];
    // eslint-disable-next-line  no-async-promise-executor
    const promise = new Promise(async (resolve) => {
      const note = (
        await engine.findNotes({
          fname,
          vault: await this._extension.wsUtils.getVaultFromUri(uri),
        })
      )[0];
      // If we can't find the note, don't do anything
      if (!note) {
        // Log at info level and not error level for now to reduce Sentry noise
        Logger.info({
          ctx,
          msg: `Note with fname ${fname} not found in engine! Skipping updated field FM modification.`,
        });
        return;
      }

      // Return undefined if document is missing frontmatter
      if (!TextDocumentService.containsFrontmatter(event.document)) {
        return;
      }
      const content = event.document.getText();
      const match = NoteUtils.RE_FM_UPDATED.exec(content);
      // update the `updated` time in frontmatter if it exists and content has changed
      if (match && WorkspaceUtils.noteContentChanged({ content, note })) {
        Logger.info({ ctx, match, msg: "update activeText editor" });
        const startPos = event.document.positionAt(match.index);
        const endPos = event.document.positionAt(match.index + match[0].length);
        changes = [
          TextEdit.replace(new Range(startPos, endPos), `updated: ${now}`),
        ];
      }
      return resolve(changes);
    });
    event.waitUntil(promise);
    return { changes };
  }

  private async onDidSaveNote(document: TextDocument) {
    // check and prompt duplicate warning.
    await DoctorUtils.findDuplicateNoteAndPromptIfNecessary(
      document,
      "onDidSaveNote"
    );
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
  private getNewlyOpenedDocument(document: TextDocument): boolean {
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
    if (!this._extension.isActive()) {
      return;
    }
    try {
      const files = args.files[0];
      const { wsRoot } = this._extension.getDWorkspace();

      const vaults = this._extension.getDWorkspace().vaults;
      const { oldUri, newUri } = files;

      // No-op if we are not dealing with a Dendron note.
      if (!NoteUtils.isNote(oldUri)) {
        return;
      }

      let oldVault: DVault;
      let oldFname: string;
      let newVault: DVault;
      let newFname: string;
      const promise = vaults.then(async (vaults) => {
        oldVault = VaultUtils.getVaultByFilePath({
          vaults,
          wsRoot,
          fsPath: oldUri.fsPath,
        });
        oldFname = DNodeUtils.fname(oldUri.fsPath);

        newVault = VaultUtils.getVaultByFilePath({
          vaults,
          wsRoot,
          fsPath: newUri.fsPath,
        });
        newFname = DNodeUtils.fname(newUri.fsPath);
        const opts = {
          oldLoc: {
            fname: oldFname,
            vaultName: VaultUtils.getName(oldVault),
          },
          newLoc: {
            fname: newFname,
            vaultName: VaultUtils.getName(newVault),
          },
          metaOnly: true,
        };
        AnalyticsUtils.track(ContextualUIEvents.ContextualUIRename);
        const engine = this._extension.getEngine();
        await engine.renameNote(opts);
      });

      args.waitUntil(promise);
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
    if (!this._extension.isActive()) {
      return;
    }
    try {
      const files = args.files[0];
      const { newUri } = files;
      const fname = DNodeUtils.fname(newUri.fsPath);
      const engine = this._extension.getEngine();
      const ws = this._extension.getDWorkspace();
      const { wsRoot } = ws;
      const vaults = await ws.vaults;

      // No-op if we are not dealing with a Dendron note.
      if (!NoteUtils.isNote(newUri)) {
        return;
      }

      const newVault = VaultUtils.getVaultByFilePath({
        vaults,
        wsRoot,
        fsPath: newUri.fsPath,
      });
      const vpath = vault2Path({ wsRoot, vault: newVault });
      const newLocPath = path.join(vpath, fname + ".md");
      const resp = file2Note(newLocPath, newVault);
      if (ErrorUtils.isErrorResp(resp)) {
        throw resp.error;
      }
      let newNote = resp.data;
      const noteHydrated = await engine.getNote(newNote.id);
      if (noteHydrated.data) {
        newNote = NoteUtils.hydrate({
          noteRaw: newNote,
          noteHydrated: noteHydrated.data,
        });
      }
      newNote.title = NoteUtils.genTitle(fname);
      await engine.writeNote(newNote);
    } catch (error: any) {
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Dendron will perform changes like moving the cursor when first opening a Dendron note
   * @returns boolean : returns `true` if Dendron made changes during `onFirstOpen` and `false` otherwise
   */
  private async onFirstOpen(editor: TextEditor) {
    Logger.info({
      ctx: context("onFirstOpen"),
      msg: "enter",
      fname: NoteUtils.uri2Fname(editor.document.uri),
    });
    const ws = this._extension.getDWorkspace();
    const { wsRoot } = ws;
    const vaults = await ws.vaults;
    const fpath = editor.document.uri.fsPath;

    // don't apply actions to non-dendron notes
    // NOTE: in the future if we add `onFirstOpen` actions to non-dendron notes, this logic will need to be updated
    if (!(await WorkspaceUtils.isDendronNote({ wsRoot, vaults, fpath }))) {
      return false;
    }

    WorkspaceWatcher.moveCursorPastFrontmatter(editor);
    const config = await ws.config;
    if (ConfigUtils.getWorkspace(config).enableAutoFoldFrontmatter) {
      await this.foldFrontmatter();
    }
    Logger.info({
      ctx: context("onFirstOpen"),
      msg: "exit",
      fname: NoteUtils.uri2Fname(editor.document.uri),
    });
    return true;
  }

  static moveCursorPastFrontmatter(editor: TextEditor) {
    const ctx = "moveCursorPastFrontmatter";
    const nodePosition = RemarkUtils.getNodePositionPastFrontmatter(
      editor.document.getText()
    );
    const startFsPath = editor.document.uri.fsPath;
    if (!_.isUndefined(nodePosition)) {
      const position = VSCodeUtils.point2VSCodePosition(nodePosition.end, {
        line: 1,
      });
      // If the user opened the document with something like the search window,
      // then VSCode is supposed to move the cursor to where the match is.
      // But if we move the cursor here, then it overwrites VSCode's move.
      // Worse, when VSCode calls this function the cursor hasn't updated yet
      // so the location will still be 0, so we have to delay a bit to let it update first.
      Wrap.setTimeout(() => {
        // Since we delayed, a new document could have opened. Make sure we're still in the document we expect
        if (
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath === startFsPath
        ) {
          const { line, character } = editor.selection.active;
          // Move the cursor, but only if it hasn't already been moved by VSCode, another extension, or a very quick user
          if (line === 0 && character === 0) {
            editor.selection = new Selection(position, position);
          } else {
            Logger.debug({
              ctx,
              msg: "not moving cursor because the cursor was moved before we could get to it",
            });
          }
        } else {
          Logger.debug({
            ctx,
            msg: "not moving cursor because the document changed before we could move it",
          });
        }
      }, MOVE_CURSOR_PAST_FRONTMATTER_DELAY);
    }
  }

  private async foldFrontmatter() {
    await VSCodeUtils.foldActiveEditorAtPosition({ line: 0 });
  }
}
