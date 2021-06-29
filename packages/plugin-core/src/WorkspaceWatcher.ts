import { NoteProps, NoteUtils, Time, VaultUtils } from "@dendronhq/common-all";
import { genHash } from "@dendronhq/common-server";
import { HistoryService } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import {
  ExtensionContext,
  Range,
  TextDocumentChangeEvent,
  TextDocumentWillSaveEvent,
  TextEdit,
  window,
  workspace,
} from "vscode";
import { Logger } from "./logger";
import { DendronWorkspace, getWS } from "./workspace";

export class WorkspaceWatcher {
  activate(context: ExtensionContext) {
    workspace.onWillSaveTextDocument(
      this.onWillSaveTextDocument,
      null,
      context.subscriptions
    );
    workspace.onDidChangeTextDocument(
      this.onDidChangeTextDocument,
      null,
      context.subscriptions
    );
  }

  async onDidChangeTextDocument(event: TextDocumentChangeEvent) {
    const activeEditor = window.activeTextEditor;
    if (activeEditor && event.document === activeEditor.document) {
      DendronWorkspace.instance().windowWatcher?.triggerUpdateDecorations();
    }
    return;
  }

  async onWillSaveTextDocument(
    ev: TextDocumentWillSaveEvent
  ): Promise<{ changes: TextEdit[] }> {
    const ctx = "WorkspaceWatcher:onWillSaveTextDocument";
    const uri = ev.document.uri;
    const reason = ev.reason;
    Logger.info({ ctx, url: uri.fsPath, reason, msg: "enter" });
    if (!getWS().workspaceService?.isPathInWorkspace(uri.fsPath)) {
      Logger.debug({ ctx, uri: uri.fsPath, msg: "not in workspace, ignoring" });
      return { changes: [] };
    }
    const eclient = DendronWorkspace.instance().getEngine();
    const fname = path.basename(uri.fsPath, ".md");
    const now = Time.now().toMillis();
    const vault = VaultUtils.getVaultByNotePath({
      fsPath: uri.fsPath,
      vaults: eclient.vaults,
      wsRoot: DendronWorkspace.wsRoot(),
    });
    const note = NoteUtils.getNoteByFnameV5({
      fname,
      vault,
      notes: eclient.notes,
      wsRoot: DendronWorkspace.wsRoot(),
    }) as NoteProps;

    // if recently changed, ignore
    const recentEvents = HistoryService.instance().lookBack();
    if (recentEvents[0].uri?.fsPath === uri.fsPath) {
      let lastUpdated: string | number = note?.updated || now;
      if (_.isString(lastUpdated)) {
        lastUpdated = _.parseInt(lastUpdated);
      }
      if (now - lastUpdated < 1 * 3e3) {
        return { changes: [] };
      }
    }

    const content = ev.document.getText();
    const matchFM = NoteUtils.RE_FM;
    const matchOuter = content.match(matchFM);
    if (!matchOuter) {
      return { changes: [] };
    }
    const match = NoteUtils.RE_FM_UPDATED.exec(content);
    const noteHash = genHash(content);
    let changes: TextEdit[] = [];
    if (match && note.contentHash && note.contentHash !== noteHash) {
      Logger.info({ ctx, match, msg: "update activeText editor" });
      const startPos = ev.document.positionAt(match.index);
      const endPos = ev.document.positionAt(match.index + match[0].length);
      changes = [
        TextEdit.replace(new Range(startPos, endPos), `updated: ${now}`),
      ];
      const p = new Promise(async (resolve) => {
        note.updated = now;
        await eclient.updateNote(note);
        return resolve(changes);
      });
      ev.waitUntil(p);
    }
    return { changes };
  }
}
