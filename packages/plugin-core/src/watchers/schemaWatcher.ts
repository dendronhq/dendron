import { DEngineClientV2 } from "@dendronhq/common-all";
import { string2Schema } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { Logger } from "../logger";
import { DendronClientUtilsV2 } from "../utils";
import { DendronWorkspace } from "../workspace";

export class SchemaWatcher {
  public watcher: vscode.FileSystemWatcher;
  /**
   * Should watching be paused
   */
  public pause: boolean;
  public L = Logger;
  public ws: DendronWorkspace;
  public engine: DEngineClientV2;

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
    this.ws = DendronWorkspace.instance();
    this.engine = this.ws.getEngine();
    this.pause = false;
  }

  activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
      this.watcher.onDidChange(this.onDidChange, this)
    );
  }

  async onDidChange(uri: vscode.Uri) {
    const ctx = "SchemaWatcher:onDidChange";
    if (this.pause) {
      return;
    }
    this.L.info({ ctx, uri });
    const engine = DendronWorkspace.instance().getEngine();
    const fname = path.basename(uri.fsPath, ".schema.yml");
    const dirname = path.dirname(uri.fsPath);
    const vault = DendronClientUtilsV2.getVault({ dirname, engine });
    const document = await vscode.workspace.openTextDocument(uri);
    const content = document.getText();

    try {
      const maybeSchema = string2Schema({
        vault,
        content,
        fname,
        wsRoot: DendronWorkspace.wsRoot(),
      });
      await engine.updateSchema(maybeSchema);
      vscode.window.showInformationMessage("schema updated");
    } catch (err) {
      if (err.msg) {
        vscode.window.showErrorMessage(err.msg);
      } else {
        vscode.window.showErrorMessage(err.message);
      }
      return;
    }
  }

  static refreshTree = _.debounce(() => {
    const ctx = "refreshTree";
    Logger.info({ ctx });
    DendronWorkspace.instance().dendronTreeView?.treeProvider.refresh();
  }, 100);
}
