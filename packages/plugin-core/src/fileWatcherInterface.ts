import { DVault } from "@dendronhq/common-all";
import { FileWatcherAdapter } from "@dendronhq/engine-server";
import vscode from "vscode";

export interface IFileWatcher {
  watchers: { vault: DVault; watcher: FileWatcherAdapter }[];

  pause: boolean;

  activate(context: vscode.ExtensionContext): void;

  onDidCreate(fsPath: string): Promise<void>;

  onDidDelete(fsPath: string): Promise<void>;

  refreshTree(): void;
}
