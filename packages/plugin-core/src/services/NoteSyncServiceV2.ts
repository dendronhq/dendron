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
  TextDocumentChangeEvent,
  workspace,
} from "vscode";
import { Logger } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";
import { DendronExtension } from "../workspace";
import { EngineAPIService } from "./EngineAPIService";

export interface INoteSyncService extends Disposable {
  get onNoteChange(): Event<NoteProps>;

  // syncNoteContents(opts: {
  //   oldNote: NoteProps;
  //   content: string;
  //   fmChangeOnly: boolean;
  //   fname: string;
  //   vault: DVault;
  // }): Promise<NoteProps>;

  // syncNoteMetadata({
  //   note,
  //   fmChangeOnly,
  // }: {
  //   note: NoteProps;
  //   fmChangeOnly: boolean;
  // }): Promise<NoteProps>;
}

/**
 * See [[Note Sync Service|dendron://dendron.docs/pkg.plugin-core.ref.note-sync-service]] for docs
 */
export class NoteSyncServiceV2 implements INoteSyncService {
  private L: DLogger;

  _changeHandler: Disposable | undefined;
  _workspace: DendronExtension;
  // _engine: EngineAPIService;

  private emitter = new EventEmitter<NoteProps>();

  public get onNoteChange(): Event<NoteProps> {
    return this.emitter.event;
  }

  constructor(ext: DendronExtension) {
    this.L = Logger;

    this._workspace = ext;

    this.emitter = new EventEmitter<NoteProps>();

    this._changeHandler = workspace.onDidChangeTextDocument(
      _.debounce(this.onDidChange, 200),
      this
    );
  }

  dispose() {
    if (this._changeHandler) {
      this._changeHandler.dispose();
      this._changeHandler = undefined;
    }
  }

  public async syncNoteContents(opts: {
    oldNote: NoteProps;
    content: string;
    fmChangeOnly: boolean;
    fname: string;
    vault: DVault;
  }) {
    const ctx = "NoteSyncServiceV2:updateNoteContents";
    const { content, fmChangeOnly, fname, vault, oldNote } = opts;
    const engine = this._workspace.getEngine();
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

    this.L.debug({ ctx, fname: note.fname, msg: "exit" });
    const noteClean = await engine.updateNote(note);

    // Temporary workaround until NoteSyncServiceV2 is no longer a singleton
    // PreviewPanelFactory.getProxy().showPreviewAndUpdate(noteClean);

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
    const engine = this._workspace.getEngine();
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

      if (this._workspace.workspaceService?.config.dev?.enableLinkCandidates) {
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

  private async onDidChange(event: TextDocumentChangeEvent) {
    // console.log("onDidChange isDirty " + event.document.isDirty);
    if (event.document.isDirty === false) {
      return;
    }

    const document = event.document;
    const contentChanges = event.contentChanges;

    const ctx = "NoteSyncServiceV2:onDidChange";
    const uri = document.uri;
    const fname = path.basename(uri.fsPath, ".md");

    if (!this._workspace.workspaceService?.isPathInWorkspace(uri.fsPath)) {
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
    const engine = this._workspace.getEngine();
    const vault = VaultUtils.getVaultByFilePath({
      vaults: engine.vaults,
      wsRoot: this._workspace.getEngine().wsRoot,
      fsPath: uri.fsPath,
    });
    const noteHydrated = NoteUtils.getNoteByFnameV5({
      fname,
      vault,
      notes: engine.notes,
      wsRoot: this._workspace.getEngine().wsRoot,
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

    this.emitter.fire(props);
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
