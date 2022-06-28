import { ServerUtils } from "@dendronhq/api-server";
import {
  DVault,
  NoteProps,
  NoteUtils,
  SchemaModuleProps,
  VaultUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { HistoryEvent, HistoryService } from "@dendronhq/engine-server";
import { ExecaChildProcess } from "execa";
import path from "path";
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "./constants";
import { ExtensionProvider } from "./ExtensionProvider";
import { Logger } from "./logger";
import { VSCodeUtils } from "./vsCodeUtils";
import { getDWorkspace, getExtension } from "./workspace";
import { WSUtilsV2 } from "./WSUtilsV2";

/**
 * Prefer to use WSUtilsV2 instead of this class to prevent circular dependencies.
 * (move methods from this file to WSUtilsV2 as needed).
 * See [[Migration of static  methods to a non-static|dendron://dendron.docs/dev.ref.impactful-change-notice#migration-of-static--methods-to-a-non-static]]
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
        if (subprocess.pid) {
          process.kill(subprocess.pid);
        }
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

  static showActivateProgress() {
    const ctx = "showActivateProgress";
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

  /**
    @deprecated. Use same method in {@link WSUtilsV2}
  **/
  static getVaultFromPath(fsPath: string) {
    const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
    return VaultUtils.getVaultByFilePath({
      wsRoot,
      vaults,
      fsPath,
    });
  }

  /**
    @deprecated. Use same method in {@link WSUtilsV2}
  **/
  static getNoteFromPath(fsPath: string) {
    const { engine } = ExtensionProvider.getDWorkspace();
    const fname = path.basename(fsPath, ".md");
    let vault: DVault;
    try {
      vault = this.getVaultFromPath(fsPath);
    } catch (err) {
      // No vault
      return undefined;
    }
    return NoteUtils.getNoteByFnameFromEngine({
      fname,
      vault,
      engine,
    });
  }

  /**
    @deprecated. Use same method in {@link WSUtilsV2}
  **/
  static getVaultFromDocument(document: vscode.TextDocument) {
    return this.getVaultFromPath(document.uri.fsPath);
  }

  /**
    @deprecated. Use same method in {@link WSUtilsV2}
  **/
  static getNoteFromDocument(document: vscode.TextDocument) {
    return this.getNoteFromPath(document.uri.fsPath);
  }

  /**
    @deprecated. Use same method in {@link WSUtilsV2}
  **/
  static tryGetNoteFromDocument = (
    document: vscode.TextDocument
  ): NoteProps | undefined => {
    return new WSUtilsV2(getExtension()).tryGetNoteFromDocument(document);
  };

  /**
    @deprecated. Use same method in {@link WSUtilsV2}
  **/
  static getActiveNote() {
    const editor = VSCodeUtils.getActiveTextEditor();
    if (editor) return this.getNoteFromDocument(editor.document);
    return;
  }

  /**
    @deprecated. Use same method in {@link WSUtilsV2}
  **/
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

  /**
    @deprecated. Use same method in {@link WSUtilsV2}
  **/
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
