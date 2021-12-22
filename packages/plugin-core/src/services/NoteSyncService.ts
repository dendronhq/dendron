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
import { PreviewPanelFactory } from "../components/views/PreviewViewFactory";
import { Logger } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";
import { getDWorkspace, getExtension } from "../workspace";

let NOTE_SERVICE: NoteSyncService | undefined;

const getFrontmatterPosition = (
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

/**
 * See [[Note Sync Service|dendron://dendron.docs/pkg.plugin-core.ref.note-sync-service]] for docs
 */
export class NoteSyncService {
  static instance() {
    if (_.isUndefined(NOTE_SERVICE)) {
      NOTE_SERVICE = new NoteSyncService();
    }
    return NOTE_SERVICE;
  }

  private L: DLogger;

  constructor() {
    this.L = Logger;
  }

  /**
   * Performs tasks that should be run when the note is changed
   * - update note links
   * - update note anchors
   * - trigger engine update
   * - trigger preview sync
   * @param uri
   * @returns
   */
  async onDidChange(
    document: vscode.TextDocument,
    hints?: { contentChanges: readonly vscode.TextDocumentContentChangeEvent[] }
  ) {
    const ctx = "NoteSyncService:onDidChange";
    const uri = document.uri;
    const { engine } = getDWorkspace();
    const fname = path.basename(uri.fsPath, ".md");

    if (!getExtension().workspaceService?.isPathInWorkspace(uri.fsPath)) {
      this.L.debug({ ctx, uri: uri.fsPath, msg: "not in workspace, ignoring" });
      return;
    }

    const maybePos = await getFrontmatterPosition(document);
    let fmChangeOnly = false;
    if (!maybePos) {
      this.L.debug({ ctx, uri: uri.fsPath, msg: "no frontmatter found" });
      return;
    }
    if (hints?.contentChanges) {
      const allChangesInFM = _.every(hints.contentChanges, (contentChange) => {
        const endPosition = contentChange.range.end;
        return endPosition.isBefore(maybePos);
      });
      if (allChangesInFM) {
        this.L.debug({ ctx, uri: uri.fsPath, msg: "frontmatter change only" });
        fmChangeOnly = true;
      }
    }

    this.L.debug({ ctx, uri: uri.fsPath });
    const vault = VaultUtils.getVaultByFilePath({
      vaults: engine.vaults,
      wsRoot: getDWorkspace().wsRoot,
      fsPath: uri.fsPath,
    });
    const noteHydrated = NoteUtils.getNoteByFnameV5({
      fname,
      vault,
      notes: engine.notes,
      wsRoot: getDWorkspace().wsRoot,
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

    return this.updateNoteContents({
      oldNote: noteHydrated,
      content,
      fmChangeOnly,
      fname,
      vault,
    });
  }

  async updateNoteContents(opts: {
    oldNote: NoteProps;
    content: string;
    fmChangeOnly: boolean;
    fname: string;
    vault: DVault;
  }) {
    const ctx = "NoteSyncService:updateNoteContents";
    const { content, fmChangeOnly, fname, vault, oldNote } = opts;
    const { engine } = getDWorkspace();
    // note is considered dirty, apply any necessary changes here
    // call `doc.getText` to get latest note
    let note = string2Note({
      content,
      fname,
      vault,
      calculateHash: true,
    });
    note = NoteUtils.hydrate({ noteRaw: note, noteHydrated: oldNote });

    note = await NoteSyncService.updateNoteMeta({ note, fmChangeOnly });

    const now = NoteUtils.genUpdateTime();
    note.updated = now;

    this.L.debug({ ctx, fname: note.fname, msg: "exit" });
    const noteClean = await engine.updateNote(note);

    // Temporary workaround until NoteSyncService is no longer a singleton
    PreviewPanelFactory.getProxy().showPreviewAndUpdate(noteClean);

    return noteClean;
  }

  /**
   * Update note metadata (eg. links and anchors)
   */
  static async updateNoteMeta({
    note,
    fmChangeOnly,
  }: {
    note: NoteProps;
    fmChangeOnly: boolean;
  }) {
    const { engine } = getDWorkspace();
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

      if (getDWorkspace().config.dev?.enableLinkCandidates) {
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
}
