import { EngineFileWatcher } from "@dendronhq/engine-server";
import _ from "lodash";
import { CONSTANTS } from "@dendronhq/common-all";
import path from "path";
import vscode, { Disposable } from "vscode";
import { _activate } from "../_extension";
import {
  uniqueOutermostFolders,
  WS_FILE_MAX_SEARCH_DEPTH,
} from "@dendronhq/common-server";

export type AutoInitCallback = () => any;

/** Watches the workspace in non-Dendron workspaces to automatically initialize the plugin if a `dendron.yml` file is added. */
export class AutoInitService implements vscode.Disposable {
  private fileWatchers: readonly Disposable[] | undefined;
  private callback: AutoInitCallback | undefined;

  private onDidCreate(filePath: string) {
    // Double-check the filename of the file that was created
    if (path.basename(filePath) !== CONSTANTS.DENDRON_CONFIG_FILE) return;
    if (this.callback) this.callback();
  }

  /** Watches current workspace folders to see if a `dendron.yml` file is created. Once one is added, the workspace will be initialized.
   *
   * Remember to dispose this service once the workspace has been initialized!
   */
  public constructor(callback: AutoInitCallback) {
    const vscodeFolders = vscode.workspace.workspaceFolders?.map(
      (vscodeFolder) => vscodeFolder.uri.fsPath
    );
    if (!vscodeFolders) return;
    const wsFolders = uniqueOutermostFolders(vscodeFolders);
    this.callback = callback;
    this.fileWatchers = wsFolders.map((folder) =>
      new EngineFileWatcher(folder, `**/${CONSTANTS.DENDRON_CONFIG_FILE}`, {
        depth: WS_FILE_MAX_SEARCH_DEPTH,
      }).onDidCreate(this.onDidCreate.bind(this))
    );
  }
  public dispose() {
    this.fileWatchers?.forEach((watcher) => watcher.dispose());
    this.fileWatchers = [];
  }
}
