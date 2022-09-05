import {
  DendronASTDest,
  DLogger,
  DVault,
  genHash,
  NoteProps,
  NoteUtils,
  Point,
  PointOffset,
  ReducedDEngine,
  string2Note,
  URI,
  VaultUtilsV2,
} from "@dendronhq/common-all";
import { MDUtilsV5 } from "@dendronhq/unified";
import _ from "lodash";
import { inject, injectable } from "tsyringe";
import visit from "unist-util-visit";
import * as vscode from "vscode";
import {
  Disposable,
  Event,
  TextDocument,
  TextDocumentChangeEvent,
} from "vscode";
import { Utils } from "vscode-uri";
import { isPathInWorkspace } from "../../web/utils/isPathInWorkspace";
import { ITextDocumentService } from "../ITextDocumentService";

/**
 * This version of TextDocumentService is specific to Web Ext and has the
 * following limitations before feature parity:
 *  - does not call refreshNoteLinksAndAnchors
 *
 * This service keeps client state note state synchronized with the engine
 * state. It also exposes an event that allows callback functionality whenever
 * the engine has finished updating a note state. See
 * {@link ITextDocumentService} See [[Note Sync
 * Service|dendron://dendron.docs/pkg.plugin-core.ref.note-sync-service]] for
 * additional docs
 */
@injectable()
export class TextDocumentService implements ITextDocumentService {
  _textDocumentEventHandle: Disposable;

  constructor(
    @inject("textDocumentEvent") textDocumentEvent: Event<TextDocument>,
    @inject("wsRoot") private wsRoot: URI,
    @inject("vaults") private vaults: DVault[],
    @inject("ReducedDEngine") private engine: ReducedDEngine,
    @inject("logger") private L: DLogger
  ) {
    this._textDocumentEventHandle = textDocumentEvent(this.onDidSave, this);
  }

  dispose() {
    this._textDocumentEventHandle.dispose();
  }

  private updateNoteContents(opts: {
    oldNote: NoteProps;
    content: string;
    fmChangeOnly: boolean;
    fname: string;
    vault: DVault;
  }) {
    const ctx = "TextDocumentService:updateNoteContents";
    const { content, fname, vault, oldNote } = opts;
    // const { content, fmChangeOnly, fname, vault, oldNote } = opts;
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
    // TODO: Add back
    // EngineUtils.refreshNoteLinksAndAnchors({
    //   note,
    //   fmChangeOnly,
    //   engine: this._extension.getEngine(),
    // });

    this.L.debug({ ctx, fname: note.fname, msg: "exit" });

    return note;
  }

  /**
   * Callback function for vscode.workspace.OnDidSaveTextDocument. Updates note
   * with contents from document and saves to engine
   * @param document
   * @returns
   */
  private async onDidSave(
    document: TextDocument
  ): Promise<NoteProps | undefined> {
    const ctx = "TextDocumentService:onDidSave";
    const uri = document.uri;
    const fname = Utils.basename(uri);

    const wsRoot = this.wsRoot;
    const vaults = this.vaults;

    if (!isPathInWorkspace({ wsRoot, vaults, fsPath: uri })) {
      this.L.debug({ ctx, uri: uri.fsPath, msg: "not in workspace, ignoring" });
      return;
    }

    this.L.debug({ ctx, uri: uri.fsPath });
    const vault = VaultUtilsV2.getVaultByFilePath({
      vaults,
      wsRoot,
      fsPath: uri,
    });

    const noteHydrated = (await this.engine.findNotes({ fname, vault }))[0];
    if (_.isUndefined(noteHydrated)) {
      return;
    }

    const content = document.getText();
    if (!this.noteContentChanged({ content, note: noteHydrated })) {
      this.L.debug({
        ctx,
        uri: uri.fsPath,
        msg: "note content unchanged, ignoring",
      });
      return noteHydrated;
    }

    const props = this.updateNoteContents({
      oldNote: noteHydrated,
      content,
      fmChangeOnly: false,
      fname,
      vault: vault!, // TODO: Remove !
    });

    const resp = await this.engine.writeNote(props);

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
    const fname = _.trimEnd(Utils.basename(uri), ".md");

    const wsRoot = this.wsRoot;
    const vaults = this.vaults;

    if (!isPathInWorkspace({ wsRoot, vaults, fsPath: uri })) {
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
    const vault = VaultUtilsV2.getVaultByFilePath({
      vaults,
      wsRoot,
      fsPath: uri,
    });
    const note = (await this.engine.findNotes({ fname, vault }))[0];

    if (_.isUndefined(note)) {
      return;
    }

    const content = document.getText();
    if (!this.noteContentChanged({ content, note })) {
      this.L.debug({
        ctx,
        uri: uri.fsPath,
        msg: "note content unchanged, ignoring",
      });
      return note;
    }

    return this.updateNoteContents({
      oldNote: note,
      content,
      fmChangeOnly,
      fname,
      vault: vault!, // TODO: Remove !
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
    if (!this.noteContentChanged({ content, note })) {
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
        const position = this.point2VSCodePosition(node.position.end, {
          line: 1,
        });
        resolve(position);
      });
    });
  };

  private noteContentChanged({
    content,
    note,
  }: {
    content: string;
    note: NoteProps;
  }) {
    const noteHash = genHash(content);
    if (_.isUndefined(note.contentHash)) {
      return true;
    }
    return noteHash !== note.contentHash;
  }

  private point2VSCodePosition(point: Point, offset?: PointOffset) {
    return new vscode.Position(
      // remark Point's are 0 indexed
      point.line - 1 + (offset?.line || 0),
      point.column - 1 + (offset?.column || 0)
    );
  }
}
