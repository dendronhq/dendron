import {
  DVault,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { DLogger, string2Note } from "@dendronhq/common-server";
import {
  DendronASTDest,
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
  TextDocument,
  TextDocumentChangeEvent,
} from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
import { Logger } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";

/**
 * Interface for a service that processes text document changes from vscode.
 */
export interface ITextDocumentService extends Disposable {
  /**
   * Process content changes from TextDocumentChangeEvent and return an updated note prop.
   *
   * Return undefined if changes cannot be processed (such as missing frontmatter or dirty changes) or if no changes have been detected
   *
   * @param event Event containing document changes
   * @return NoteProps
   */
  processTextDocumentChangeEvent(
    event: TextDocumentChangeEvent
  ): Promise<NoteProps | undefined>;

  /**
   * Apply content from a TextDocument to an existing note
   *
   * @param note Existing note to update
   * @param textDocument TextDocument representation of note. May or may not have content changes from note
   * @return New NoteProps with updated contents from TextDocument
   */
  applyTextDocumentToNoteProps(
    note: NoteProps,
    textDocument: TextDocument
  ): Promise<NoteProps>;
}

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
    note = NoteUtils.hydrate({ noteRaw: note, noteHydrated: oldNote });
    note = await NoteUtils.updateNoteMetadata({
      note,
      fmChangeOnly,
      engine: this._extension.getEngine(),
      enableLinkCandidates:
        this._extension.workspaceService?.config.dev?.enableLinkCandidates,
    });

    this.L.debug({ ctx, fname: note.fname, msg: "exit" });

    return note;
  }

  /**
   * Callback function for vscode.workspace.OnDidSaveTextDocument. Updates note with contents from document and saves to engine
   * @param document
   * @returns
   */
  private async onDidSave(document: TextDocument) {
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
    const noteHydrated = NoteUtils.getNoteByFnameFromEngine({
      fname,
      vault,
      engine,
    });
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
    return engine.updateNote(props);
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
    const noteHydrated = NoteUtils.getNoteByFnameFromEngine({
      fname,
      vault,
      engine,
    });
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

    const maybePos = await this.getFrontmatterPosition(textDocument);
    if (!maybePos) {
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

  // eslint-disable-next-line camelcase
  __DO_NOT_USE_IN_PROD_exposePropsForTesting() {
    return {
      onDidSave: this.onDidSave.bind(this),
    };
  }
}
