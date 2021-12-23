import { ServerUtils } from "@dendronhq/api-server";
import { DVault, NoteProps, SchemaModuleProps } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { HistoryEvent, HistoryService } from "@dendronhq/engine-server";
import { ExecaChildProcess } from "execa";
import path from "path";
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "./constants";
import { Logger } from "./logger";
import { VSCodeUtils } from "./vsCodeUtils";
import { getDWorkspace, getExtension } from "./workspace";
import { WSUtilsV2 } from "./WSUtilsV2";

/**
 * Prefer to use WSUtilsV2 instead of this class to prevent circular dependencies.
 * (move methods from this file to WSUtilsV2 as needed).
 * */
export class WSUtils {
  static handleServerProcess({
    subprocess,
    context,
    onExit,
  }: {
    subprocess: ExecaChildProcess;
    context: vscode.ExtensionContext;
    onExit: Parameters<typeof ServerUtils["onProcessExit"]>[0]["cb"];
  }) {
    const ctx = "WSUtils.handleServerProcess";
    Logger.info({ ctx, msg: "subprocess running", pid: subprocess.pid });
    // if extension closes, reap server process
    context.subscriptions.push(
      new vscode.Disposable(() => {
        Logger.info({ ctx, msg: "kill server start" });
        process.kill(subprocess.pid);
        Logger.info({ ctx, msg: "kill server end" });
      })
    );
    // if server process has issues, prompt user to restart
    ServerUtils.onProcessExit({
      // @ts-ignore
      subprocess,
      cb: onExit,
    });
  }

  static showInitProgress() {
    const ctx = "showInitProgress";
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Starting Dendron...",
        cancellable: true,
      },
      (_progress, _token) => {
        _token.onCancellationRequested(() => {
          // eslint-disable-next-line no-console
          console.log("Cancelled");
        });

        const p = new Promise((resolve) => {
          HistoryService.instance().subscribe(
            "extension",
            async (_event: HistoryEvent) => {
              if (_event.action === "initialized") {
                resolve(undefined);
              }
            }
          );
          HistoryService.instance().subscribe(
            "extension",
            async (_event: HistoryEvent) => {
              if (_event.action === "not_initialized") {
                Logger.error({ ctx, msg: "issue initializing Dendron" });
                resolve(undefined);
              }
            }
          );
        });
        return p;
      }
    );
  }

  /**
   * Performs a series of step to initialize the workspace
   *  Calls activate workspace
   * - initializes DendronEngine
   * @param mainVault
   */
  static async reloadWorkspace() {
    try {
      const out = await vscode.commands.executeCommand(
        DENDRON_COMMANDS.RELOAD_INDEX.key,
        true
      );
      return out;
    } catch (err) {
      Logger.error({ error: err as any });
    }
  }

  //moved
  static getVaultFromDocument(document: vscode.TextDocument) {
    return new WSUtilsV2(getExtension()).getVaultFromDocument(document);
  }

  static getNoteFromDocument(document: vscode.TextDocument) {
    return new WSUtilsV2(getExtension()).getNoteFromDocument(document);
  }

  static tryGetNoteFromDocument = (
    document: vscode.TextDocument
  ): NoteProps | undefined => {
    return new WSUtilsV2(getExtension()).tryGetNoteFromDocument(document);
  };

  static getActiveNote() {
    const editor = VSCodeUtils.getActiveTextEditor();
    if (editor) return this.getNoteFromDocument(editor.document);
    return;
  }

  private static async openFileInEditorUsingFullFname(
    vault: DVault,
    fnameWithExtension: string
  ) {
    const wsRoot = getDWorkspace().wsRoot;
    const vpath = vault2Path({ vault, wsRoot });
    const notePath = path.join(vpath, fnameWithExtension);
    const editor = await VSCodeUtils.openFileInEditor(
      vscode.Uri.file(notePath)
    );
    return editor as vscode.TextEditor;
  }

  static async openNoteByPath({
    vault,
    fname,
  }: {
    vault: DVault;
    fname: string;
  }) {
    const { wsRoot } = getDWorkspace();
    const vpath = vault2Path({ vault, wsRoot });
    const notePath = path.join(vpath, `${fname}.md`);
    const editor = await VSCodeUtils.openFileInEditor(
      vscode.Uri.file(notePath)
    );
    return editor as vscode.TextEditor;
  }

  static async openNote(note: NoteProps) {
    const { vault, fname } = note;
    const fnameWithExtension = `${fname}.md`;
    return this.openFileInEditorUsingFullFname(vault, fnameWithExtension);
  }

  static async openSchema(schema: SchemaModuleProps) {
    const { vault, fname } = schema;
    const fnameWithExtension = `${fname}.schema.yml`;
    return this.openFileInEditorUsingFullFname(vault, fnameWithExtension);
  }
}
