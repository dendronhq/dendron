import { NoteProps, NoteUtils, VaultUtils } from "@dendronhq/common-all";
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
import * as vscode from "vscode";
import { ShowPreviewV2Command } from "../commands/ShowPreviewV2";
import { Logger } from "../logger";
import { DendronWorkspace, getWS } from "../workspace";
import visit from "unist-util-visit";
import { VSCodeUtils } from "../utils";

let NOTE_SERVICE: NoteSyncService | undefined;

const getFrontmatterPosition = (
  editor: vscode.TextEditor
): Promise<vscode.Position | false> => {
  return new Promise((resolve) => {
    const proc = MDUtilsV5.procRemarkParseNoData(
      {},
      { dest: DendronASTDest.MD_DENDRON }
    );
    const parsed = proc.parse(editor.document.getText());
    visit(parsed, ["yaml"], (node) => {
      if (_.isUndefined(node.position)) return resolve(false); // Should never happen
      const position = VSCodeUtils.point2VSCodePosition(
        node.position.end,
        { line: 1 }
      );
      resolve(position);
    });
  });
};

/**
 * Keep notes on disk in sync with engine
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
    editor: vscode.TextEditor,
    hints?: { contentChanges: readonly vscode.TextDocumentContentChangeEvent[] }
  ) {
    const ctx = "NoteSyncService:onDidChange";
    const uri = editor.document.uri;
    const eclient = DendronWorkspace.instance().getEngine();
    const fname = path.basename(uri.fsPath, ".md");

    if (!getWS().workspaceService?.isPathInWorkspace(uri.fsPath)) {
      this.L.debug({ ctx, uri: uri.fsPath, msg: "not in workspace, ignoring" });
      return;
    }

    const maybePos = await getFrontmatterPosition(editor);
    let fmChangeOnly = false;
    if (!maybePos) {
      this.L.debug({ ctx, uri: uri.fsPath, msg: "no frontmatter found" });
      return;
    }
    if (hints?.contentChanges) {
      const allChangesInFM = _.every(hints.contentChanges, contentChange => {
        const endPosition = contentChange.range.end;
        return endPosition.isBefore(maybePos)
      });
      if (allChangesInFM) {
        this.L.debug({ ctx, uri: uri.fsPath, msg: "frontmatter change only" });
        fmChangeOnly = true;
      }
    }

    this.L.debug({ ctx, uri: uri.fsPath });
    const vault = VaultUtils.getVaultByNotePath({
      vaults: eclient.vaults,
      wsRoot: DendronWorkspace.wsRoot(),
      fsPath: uri.fsPath,
    });
    const noteHydrated = NoteUtils.getNoteByFnameV5({
      fname,
      vault,
      notes: eclient.notes,
      wsRoot: DendronWorkspace.wsRoot(),
    }) as NoteProps;

    // NOTE: it might be worthwile to only do this after checking that the current note is still active
    //
    // we have this logic currently and it doesn't seem to be causing issues
    // this could lead to thrashing if user makes a change and quickly changes to a dififerent active window
    // in practice, this has never been reported
    const doc = editor.document;
    const content = doc.getText();
    if (!WorkspaceUtils.noteContentChanged({ content, note: noteHydrated })) {
      this.L.debug({
        ctx,
        uri: uri.fsPath,
        msg: "note content unchanged, ignoring",
      });
      return;
    }

    // note is considered dirty, apply any necessary changes here
    // call `doc.getText` to get latest note
    let note = string2Note({
      content: doc.getText(),
      fname,
      vault,
      calculateHash: true,
    });
    note = NoteUtils.hydrate({ noteRaw: note, noteHydrated });

    // iif frontmatter changed, don't bother with heavy updates
    if (!fmChangeOnly) {
      const links = LinkUtils.findLinks({ note, engine: eclient });
      const notesMap = NoteUtils.createFnameNoteMap(
        _.values(eclient.notes),
        true
      );
      note.links = links;
      const anchors = await AnchorUtils.findAnchors({
        note,
        wsRoot: eclient.wsRoot,
      });
      note.anchors = anchors;

      if (getWS().config.dev?.enableLinkCandidates) {
        const linkCandidates = LinkUtils.findLinkCandidates({
          note,
          notesMap,
          engine: eclient,
        });
        note.links = links.concat(linkCandidates);
      }

      const now = NoteUtils.genUpdateTime();
      note.updated = now;
    }

    this.L.debug({ ctx, fname, msg: "exit" });
    const noteClean = await eclient.updateNote(note);
    ShowPreviewV2Command.refresh(noteClean);
    return noteClean;
  }
}
