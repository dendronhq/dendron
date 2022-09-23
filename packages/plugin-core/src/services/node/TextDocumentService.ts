import {
  DVault,
  NoteProps,
  NoteUtils,
  string2Note,
  VaultUtils,
} from "@dendronhq/common-all";
import { DConfig, DLogger } from "@dendronhq/common-server";
import { EngineUtils, WorkspaceUtils } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import {
  Disposable,
  Event,
  TextDocument,
  TextDocumentChangeEvent,
} from "vscode";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { Logger } from "../../logger";
import { ITextDocumentService } from "../ITextDocumentService";
import { EditorUtils } from "../../utils/EditorUtils";

/**
 * This service keeps client state note state synchronized with the engine
 * state. It also exposes an event that allows callback functionality whenever
 * the engine has finished updating a note state. See {@link ITextDocumentService}
 * See [[Note Sync Service|dendron://dendron.docs/pkg.plugin-core.ref.note-sync-service]] for
 * additional docs
 */
export class TextDocumentService implements ITextDocumentService {
  private L: DLogger;

  _textDocumentEventHandle: Disposable;
  _extension: IDendronExtension;

  /**
   *
   * @param ext Instance of IDendronExtension
   * @param textDocumentEvent - Event returning TextDocument, such as
   * vscode.workspace.OnDidSaveTextDocument. This call is not debounced
   */
  constructor(ext: IDendronExtension, textDocumentEvent: Event<TextDocument>) {
    this.L = Logger;
    this._extension = ext;
    this._textDocumentEventHandle = textDocumentEvent(this.onDidSave, this);
  }

  dispose() {
    this._textDocumentEventHandle.dispose();
  }

  private async updateNoteContents(opts: {
    oldNote: NoteProps;
    content: string;
    fmChangeOnly: boolean;
    fname: string;
    vault: DVault;
  }) {
    const ctx = "TextDocumentService:updateNoteContents";
    const { content, fmChangeOnly, fname, vault, oldNote } = opts;
    // note is considered dirty, apply any necessary changes here
    // call `doc.getText` to get latest note
    let note = string2Note({
      content,
      fname,
      vault,
      calculateHash: true,
    });
    // when the note changes, other notes that link to this note should still be valid
    // hence we keep backlinks when hydrating
    note = NoteUtils.hydrate({
      noteRaw: note,
      noteHydrated: oldNote,
      opts: {
        keepBackLinks: true,
      },
    });
    await EngineUtils.refreshNoteLinksAndAnchors({
      note,
      fmChangeOnly,
      engine: this._extension.getEngine(),
      config: DConfig.readConfigSync(this._extension.getDWorkspace().wsRoot),
    });

    this.L.debug({ ctx, fname: note.fname, msg: "exit" });

    return note;
  }

  /**
   * Callback function for vscode.workspace.OnDidSaveTextDocument. Updates note with contents from document and saves to engine
   * @param document
   * @returns
   */
  private async onDidSave(
    document: TextDocument
  ): Promise<NoteProps | undefined> {
    const ctx = "TextDocumentService:onDidSave";
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
      wsRoot,
      fsPath: uri.fsPath,
    });
    const noteHydrated = (await engine.findNotes({ fname, vault }))[0];
    if (_.isUndefined(noteHydrated)) {
      return;
    }

    const content = document.getText();
    if (!WorkspaceUtils.noteContentChanged({ content, note: noteHydrated })) {
      this.L.debug({
        ctx,
        uri: uri.fsPath,
        msg: "note content unchanged, ignoring",
      });
      return noteHydrated;
    }

    const props = await this.updateNoteContents({
      oldNote: noteHydrated,
      content,
      fmChangeOnly: false,
      fname,
      vault,
    });

    const resp = await engine.writeNote(props, { metaOnly: true });

    // This altering of response type is only for maintaining test compatibility
    if (resp.data && resp.data.length > 0) {
      return resp.data[0].note;
    }

    return;
  }

  /**
   * See {@link ITextDocumentService.processTextDocumentChangeEvent}
   */
  public async processTextDocumentChangeEvent(event: TextDocumentChangeEvent) {
    if (event.document.isDirty === false) {
      return;
    }

    const document = event.document;
    const contentChanges = event.contentChanges;

    const ctx = "TextDocumentService:processTextDocumentChangeEvent";
    const uri = document.uri;
    const fname = path.basename(uri.fsPath, ".md");

    const { wsRoot, vaults } = this._extension.getDWorkspace();
    if (
      !WorkspaceUtils.isPathInWorkspace({ wsRoot, vaults, fpath: uri.fsPath })
    ) {
      this.L.debug({ ctx, uri: uri.fsPath, msg: "not in workspace, ignoring" });
      return;
    }

    const maybePos = await EditorUtils.getFrontmatterPosition({ document });
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
    const noteHydrated = (await engine.findNotes({ fname, vault }))[0];
    if (_.isUndefined(noteHydrated)) {
      return;
    }

    const content = document.getText();
    if (!WorkspaceUtils.noteContentChanged({ content, note: noteHydrated })) {
      this.L.debug({
        ctx,
        uri: uri.fsPath,
        msg: "note content unchanged, ignoring",
      });
      return noteHydrated;
    }

    return this.updateNoteContents({
      oldNote: noteHydrated,
      content,
      fmChangeOnly,
      fname,
      vault,
    });
  }

  /**
   * See {@link ITextDocumentService.applyTextDocumentToNoteProps}
   */
  public async applyTextDocumentToNoteProps(
    note: NoteProps,
    textDocument: TextDocument
  ) {
    const ctx = "TextDocumentService:applyTextDocument";
    const uri = textDocument.uri;

    if (!TextDocumentService.containsFrontmatter(textDocument)) {
      this.L.debug({ ctx, uri: uri.fsPath, msg: "no frontmatter found" });
      return note;
    }

    this.L.debug({ ctx, uri: uri.fsPath });

    const content = textDocument.getText();
    if (!WorkspaceUtils.noteContentChanged({ content, note })) {
      this.L.debug({
        ctx,
        uri: uri.fsPath,
        msg: "note content unchanged, returning original note",
      });
      return note;
    }

    return this.updateNoteContents({
      oldNote: note,
      content,
      fmChangeOnly: false,
      fname: note.fname,
      vault: note.vault,
    });
  }

  /**
   * Returns true if textDocument contains frontmatter. False otherwise.
   */
  public static containsFrontmatter(textDocument: TextDocument) {
    const content = textDocument.getText();
    const matchFM = NoteUtils.RE_FM;
    const maybeMatch = content.match(matchFM);
    if (!maybeMatch) {
      return false;
    }
    return true;
  }

  // eslint-disable-next-line camelcase
  __DO_NOT_USE_IN_PROD_exposePropsForTesting() {
    return {
      onDidSave: this.onDidSave.bind(this),
    };
  }
}
