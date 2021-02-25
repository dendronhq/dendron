import {
  NotePropsV2,
  NoteUtilsV2,
  Time,
  VaultUtils,
} from "@dendronhq/common-all";
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
import { DendronWorkspace } from "./workspace";

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

  async onWillSaveTextDocument(ev: TextDocumentWillSaveEvent) {
    const ctx = "WorkspaceWatcher:onWillSaveTextDocument";
    const uri = ev.document.uri;
    const reason = ev.reason;
    Logger.info({ ctx, url: uri.fsPath, reason, msg: "enter" });
    const eclient = DendronWorkspace.instance().getEngine();
    const fname = path.basename(uri.fsPath, ".md");
    const now = Time.now().toMillis();

    const vault = VaultUtils.getVaultByNotePathV4({
      fsPath: uri.fsPath,
      vaults: eclient.vaultsv3,
      wsRoot: DendronWorkspace.wsRoot(),
    });
    const note = NoteUtilsV2.getNoteByFnameV5({
      fname,
      vault,
      notes: eclient.notes,
      wsRoot: DendronWorkspace.wsRoot(),
    }) as NotePropsV2;

    // if recently changed, ignore
    const recentEvents = HistoryService.instance().lookBack();
    if (recentEvents[0].uri?.fsPath === uri.fsPath) {
      let lastUpdated: string | number = note?.updated || now;
      if (_.isString(lastUpdated)) {
        lastUpdated = _.parseInt(lastUpdated);
      }
      if (now - lastUpdated < 1 * 3e3) {
        return;
      }
    }

    const content = ev.document.getText();
    const matchFM = NoteUtilsV2.RE_FM;
    const matchOuter = content.match(matchFM);
    if (!matchOuter) {
      return;
    }
    const match = NoteUtilsV2.RE_FM_UPDATED.exec(content);
    if (match) {
      Logger.info({ ctx, match, msg: "update activeText editor" });
      const startPos = ev.document.positionAt(match.index);
      const endPos = ev.document.positionAt(match.index + match[0].length);
      const p = new Promise(async (resolve) => {
        note.updated = now.toString();
        await eclient.updateNote(note);
        resolve([
          TextEdit.replace(new Range(startPos, endPos), `updated: ${now}`),
        ]);
      });
      ev.waitUntil(p);
    }
    return;
  }
}
