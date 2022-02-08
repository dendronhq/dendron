import {
  ConfigUtils,
  DVault,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { DLogger, string2Note } from "@dendronhq/common-server";
import {
  AnchorUtils,
  DendronASTDest,
  LinkUtils,
  MDUtilsV5,
  WorkspaceUtils,
} from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import visit from "unist-util-visit";
import * as vscode from "vscode";
import {
  Disposable,
  Event,
  EventEmitter,
  TextDocument,
  TextDocumentChangeEvent,
} from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
import { Logger } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";

/**
 * Interface for a service that synchronizes notes from the client to the engine
 */
export interface INoteSyncService extends Disposable {
  /**
   * @deprecated - use EngineEvents interface instead
   * Event that fires after a set of NoteProps has been changed AND those
   * changes have been reflected on the engine side
   */
  get onNoteChange(): Event<NoteProps>;

  /**
   * @deprecated - Remove from interface once FileWatcher has been refactored to
   * no longer take a dependency on sync service
   * @param param0
   */
  syncNoteMetadata({
    note,
    fmChangeOnly,
  }: {
    note: NoteProps;
    fmChangeOnly: boolean;
  }): Promise<NoteProps>;
}

/**
 * This service keeps client state note state synchronized with the engine
 * state. It also exposes an event that allows callback functionality whenever
 * the engine has finished updating a note state. See {@link INoteSyncService}
 * See [[Note Sync Service|dendron://dendron.docs/pkg.plugin-core.ref.note-sync-service]] for
 * additional docs
 */
export class NoteSyncService implements INoteSyncService {
  private L: DLogger;

  _textDocumentEventHandle: Disposable;
  _textDocumentChangeEventHandle: Disposable;

  _extension: IDendronExtension;

  private _emitter = new EventEmitter<NoteProps>();

  public get onNoteChange(): Event<NoteProps> {
    return this._emitter.event;
  }

  /**
   *
   * @param ext Instance of IDendronExtension
   * @param textDocumentEvent - Event returning TextDocument, such as
   * vscode.workspace.OnDidSaveTextDocument. This call is not debounced
   * @param textDocumentChangeEvent - Event returning a TextDocumentChangeEvent,
   * such as vscode.workspace.OnDidChangeTextDocument. This call is debounced
   * every 200 ms
   */
  constructor(
    ext: IDendronExtension,
    textDocumentEvent: Event<TextDocument>,
    textDocumentChangeEvent: Event<TextDocumentChangeEvent>
  ) {
    this.L = Logger;
    this._extension = ext;
    this._emitter = new EventEmitter<NoteProps>();

    this._textDocumentEventHandle = textDocumentEvent(this.onDidSave, this);
    this._textDocumentChangeEventHandle = textDocumentChangeEvent(
      _.debounce(this.onDidChange, 200),
      this
    );
  }

  dispose() {
    this._textDocumentEventHandle.dispose();
    this._textDocumentChangeEventHandle.dispose();
  }

  private async syncNoteContents(opts: {
    oldNote: NoteProps;
    content: string;
    fmChangeOnly: boolean;
    fname: string;
    vault: DVault;
  }) {
    const ctx = "NoteSyncService:updateNoteContents";
    const { content, fmChangeOnly, fname, vault, oldNote } = opts;
    const engine = this._extension.getEngine();
    // note is considered dirty, apply any necessary changes here
    // call `doc.getText` to get latest note
    let note = string2Note({
      content,
      fname,
      vault,
      calculateHash: true,
    });
    note = NoteUtils.hydrate({ noteRaw: note, noteHydrated: oldNote });
    note = await this.syncNoteMetadata({ note, fmChangeOnly });

    const now = NoteUtils.genUpdateTime();
    note.updated = now;

    const noteClean = await engine.updateNote(note);
    this.L.debug({ ctx, fname: note.fname, msg: "exit" });
    return noteClean;
  }

  /**
   * Update note metadata (eg. links and anchors)
   */
  public async syncNoteMetadata({
    note,
    fmChangeOnly,
  }: {
    note: NoteProps;
    fmChangeOnly: boolean;
  }) {
    const engine = this._extension.getEngine();
    // Avoid calculating links/anchors if the note is too long
    if (
      note.body.length > ConfigUtils.getWorkspace(engine.config).maxNoteLength
    ) {
      return note;
    }
    // Links have to be updated even with frontmatter only changes
    // because `tags` in frontmatter adds new links
    const links = LinkUtils.findLinks({ note, engine });
    note.links = links;

    // if only frontmatter changed, don't bother with heavy updates
    if (!fmChangeOnly) {
      const notesMap = NoteUtils.createFnameNoteMap(
        _.values(engine.notes),
        true
      );
      const anchors = await AnchorUtils.findAnchors({
        note,
        wsRoot: engine.wsRoot,
      });
      note.anchors = anchors;

      if (this._extension.workspaceService?.config.dev?.enableLinkCandidates) {
        const linkCandidates = LinkUtils.findLinkCandidates({
          note,
          notesMap,
          engine,
        });
        note.links = links.concat(linkCandidates);
      }
    }

    return note;
  }

  private async onDidSave(document: TextDocument) {
    const ctx = "NoteSyncService:onDidChange";
    const uri = document.uri;
    const fname = path.basename(uri.fsPath, ".md");

    const { wsRoot, vaults } = this._extension.getDWorkspace();
    if (
      !WorkspaceUtils.isPathInWorkspace({ wsRoot, vaults, fpath: uri.fsPath })
    ) {
      this.L.debug({ ctx, uri: uri.fsPath, msg: "not in workspace, ignoring" });
      return;
    }

    this.L.debug({ ctx, uri: uri.fsPath });
    const engine = this._extension.getEngine();
    const vault = VaultUtils.getVaultByFilePath({
      vaults: engine.vaults,
      wsRoot: this._extension.getEngine().wsRoot,
      fsPath: uri.fsPath,
    });
    const noteHydrated = NoteUtils.getNoteByFnameV5({
      fname,
      vault,
      notes: engine.notes,
      wsRoot: this._extension.getEngine().wsRoot,
    }) as NoteProps;

    const content = document.getText();
    if (!WorkspaceUtils.noteContentChanged({ content, note: noteHydrated })) {
      this.L.debug({
        ctx,
        uri: uri.fsPath,
        msg: "note content unchanged, ignoring",
      });
      return;
    }

    const props = await this.syncNoteContents({
      oldNote: noteHydrated,
      content,
      fmChangeOnly: false,
      fname,
      vault,
    });

    this._emitter.fire(props);
  }

  private async onDidChange(event: TextDocumentChangeEvent) {
    if (event.document.isDirty === false) {
      return;
    }

    const document = event.document;
    const contentChanges = event.contentChanges;

    const ctx = "NoteSyncService:onDidChange";
    const uri = document.uri;
    const fname = path.basename(uri.fsPath, ".md");

    const { wsRoot, vaults } = this._extension.getDWorkspace();
    if (
      !WorkspaceUtils.isPathInWorkspace({ wsRoot, vaults, fpath: uri.fsPath })
    ) {
      this.L.debug({ ctx, uri: uri.fsPath, msg: "not in workspace, ignoring" });
      return;
    }

    const maybePos = await this.getFrontmatterPosition(document);
    let fmChangeOnly = false;
    if (!maybePos) {
      this.L.debug({ ctx, uri: uri.fsPath, msg: "no frontmatter found" });
      return;
    }
    if (contentChanges) {
      const allChangesInFM = _.every(contentChanges, (contentChange) => {
        const endPosition = contentChange.range.end;
        return endPosition.isBefore(maybePos);
      });
      if (allChangesInFM) {
        this.L.debug({ ctx, uri: uri.fsPath, msg: "frontmatter change only" });
        fmChangeOnly = true;
      }
    }

    this.L.debug({ ctx, uri: uri.fsPath });
    const engine = this._extension.getEngine();
    const vault = VaultUtils.getVaultByFilePath({
      vaults: engine.vaults,
      wsRoot: this._extension.getEngine().wsRoot,
      fsPath: uri.fsPath,
    });
    const noteHydrated = NoteUtils.getNoteByFnameV5({
      fname,
      vault,
      notes: engine.notes,
      wsRoot: this._extension.getEngine().wsRoot,
    }) as NoteProps;

    const content = document.getText();
    if (!WorkspaceUtils.noteContentChanged({ content, note: noteHydrated })) {
      this.L.debug({
        ctx,
        uri: uri.fsPath,
        msg: "note content unchanged, ignoring",
      });
      return;
    }
    const props = await this.syncNoteContents({
      oldNote: noteHydrated,
      content,
      fmChangeOnly,
      fname,
      vault,
    });
    this._emitter.fire(props);
  }

  private getFrontmatterPosition = (
    document: vscode.TextDocument
  ): Promise<vscode.Position | false> => {
    return new Promise((resolve) => {
      const proc = MDUtilsV5.procRemarkParseNoData(
        {},
        { dest: DendronASTDest.MD_DENDRON }
      );
      const parsed = proc.parse(document.getText());
      visit(parsed, ["yaml"], (node) => {
        if (_.isUndefined(node.position)) return resolve(false); // Should never happen
        const position = VSCodeUtils.point2VSCodePosition(node.position.end, {
          line: 1,
        });
        resolve(position);
      });
    });
  };
}
