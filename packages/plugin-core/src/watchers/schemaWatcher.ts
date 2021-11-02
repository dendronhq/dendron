import { DEngineClient, VaultUtils } from "@dendronhq/common-all";
import { string2Schema } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { Logger } from "../logger";
import { DendronExtension, getExtension, getDWorkspace } from "../workspace";
import * as Sentry from "@sentry/node";

export class SchemaWatcher {
  public watcher: vscode.FileSystemWatcher;
  /**
   * Should watching be paused
   */
  public pause: boolean;
  public L = Logger;
  public ws: DendronExtension;
  public engine: DEngineClient;

  constructor({ vaults }: { vaults: vscode.WorkspaceFolder[] }) {
    const rootFolder = vaults[0];
    const pattern = new vscode.RelativePattern(rootFolder, "*.schema.yml");
    const watcher = vscode.workspace.createFileSystemWatcher(
      pattern,
      true,
      false,
      true
    );
    this.watcher = watcher;
    this.ws = getExtension();
    this.engine = this.ws.getEngine();
    this.pause = false;
  }

  activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
      this.watcher.onDidChange(this.onDidChange, this)
    );
  }

  async onDidChange(uri: vscode.Uri) {
    try {
      const ctx = "SchemaWatcher:onDidChange";
      if (this.pause) {
        return;
      }
      this.L.info({ ctx, uri });
      const { engine } = getDWorkspace();
      const { vaults, wsRoot } = engine;
      const fname = path.basename(uri.fsPath, ".schema.yml");
      const dirname = path.dirname(uri.fsPath);
      const vault = VaultUtils.getVaultByDirPath({
        vaults,
        wsRoot,
        fsPath: dirname,
      });
      const document = await vscode.workspace.openTextDocument(uri);
      const content = document.getText();

      try {
        const maybeSchema = await string2Schema({
          vault,
          content,
          fname,
          wsRoot: getDWorkspace().wsRoot,
        });
        await engine.updateSchema(maybeSchema);
        vscode.window.showInformationMessage("schema updated");
      } catch (err: any) {
        if (err.msg) {
          vscode.window.showErrorMessage(err.msg);
        } else {
          vscode.window.showErrorMessage(err.message);
        }
        return;
      }
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  static refreshTree = _.debounce(() => {
    const ctx = "refreshTree";
    Logger.info({ ctx });
    getExtension().dendronTreeView?.treeProvider.refresh();
  }, 100);
}
