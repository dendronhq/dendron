import { NoteProps, NoteUtils, VaultUtils } from "@dendronhq/common-all";
import { DLogger, string2Note } from "@dendronhq/common-server";
import {
  AnchorUtils,
  LinkUtils,
  WorkspaceUtils,
} from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { ShowPreviewV2Command } from "../commands/ShowPreviewV2";
import { Logger } from "../logger";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace, getWS } from "../workspace";

let NOTE_SERVICE: NoteSyncService | undefined;

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
  async onDidChange(uri: vscode.Uri) {
    const ctx = "NoteSyncService:onDidChange";

    const eclient = DendronWorkspace.instance().getEngine();
    const fname = path.basename(uri.fsPath, ".md");

    if (!getWS().workspaceService?.isPathInWorkspace(uri.fsPath)) {
      this.L.debug({ ctx, uri: uri.fsPath, msg: "not in workspace, ignoring" });
      return;
    }
    this.L.info({ ctx, uri: uri.fsPath });
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

    // TODO: only open if note is still active
    const editor = await VSCodeUtils.openNote(noteHydrated);
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
    const now = NoteUtils.genUpdateTime();

    // update updated time
    const matchFM = NoteUtils.RE_FM;
    const matchOuter = content.match(matchFM);
    const match = NoteUtils.RE_FM_UPDATED.exec(content);
    if (matchOuter && match) {
      const lastUpdated = parseInt(match[1], 10);
      // only update if last updated tiime is less than a minute
      if (now - lastUpdated > 1000 * 10) {
        const startPos = doc.positionAt(match.index);
        const endPos = doc.positionAt(match.index + match[0].length);
        await editor.edit((builder) => {
          builder.replace(
            new vscode.Range(startPos, endPos),
            `updated: ${now}`
          );
        });
      }
    }

    // call `doc.getText` to get latest note
    let note = string2Note({
      content: doc.getText(),
      fname,
      vault,
      calculateHash: true,
    });
    note = NoteUtils.hydrate({ noteRaw: note, noteHydrated });
    const links = LinkUtils.findLinks({ note, engine: eclient });
    note.links = links;
    const anchors = await AnchorUtils.findAnchors({
      note,
      wsRoot: eclient.wsRoot,
    });
    note.anchors = anchors;
    note.updated = NoteUtils.genUpdateTime();

    this.L.info({ ctx, fname, msg: "exit" });
    const noteClean = await eclient.updateNote(note);
    ShowPreviewV2Command.refresh(noteClean);
    return noteClean;
  }
}
