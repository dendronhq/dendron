import { getAndInitializeEngine } from "@dendronhq/engine-server";
import execa from 'execa';
import * as vscode from "vscode";

import { Logger, TraceLevel } from "./logger";
import { VSCodeUtils, FileUtils } from "./utils";
import fs from "fs-extra";
import path from "path";
import { setEnv } from "@dendronhq/common-all";

// === Main
// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  const ctx = "activate";
  const { logPath, extensionPath, extensionUri, storagePath, globalStoragePath } = context;
  fs.ensureDirSync(context.logPath);
  setEnv("LOG_DST", path.join(context.logPath, "dendron.log"));

  const { DendronWorkspace } = require("./workspace");
  const ws = new DendronWorkspace(context);

  // init logs
  Logger.configure(context, TraceLevel.Debug);
  Logger.debug({ ctx, logPath, extensionPath, extensionUri, storagePath, globalStoragePath });
  ws.L.info({ ctx, logPath, extensionPath, extensionUri, storagePath, globalStoragePath });
  console.log("active", logPath, extensionPath);
  if (DendronWorkspace.isActive()) {
    ws.L.info({ ctx, msg: "isActive" });
    const wsFolders = vscode.workspace.workspaceFolders;
    Logger.debug({ ctx, wsFolders });
    const mainVault = wsFolders![0].uri.fsPath;
    getAndInitializeEngine(mainVault).then(() => {
      Logger.debug({ ctx, msg: "engine Initialized" });
    }, (err) => {
      vscode.window.showErrorMessage(JSON.stringify(err));
    });
    if (VSCodeUtils.isDebuggingExtension()) {
      Logger.output?.show(false);
      const fullLogPath = FileUtils.escape(path.join(logPath, 'dendron.log'));
      // TODO
      const cmd = `/usr/local/bin/code-insiders ${fullLogPath}`;
      execa.command(cmd);
      vscode.window.showInformationMessage(`logs at ${fullLogPath}`);
    }
  }
}

// this method is called when your extension is deactivated
export function deactivate() {
  const ctx = "deactivate";
  const { DendronWorkspace } = require("./workspace");
  DendronWorkspace.instance().L.info({ ctx });
}
