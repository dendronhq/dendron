import { getStage } from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { Uri } from "vscode";
import { GLOBAL_STATE } from "./constants";
import { Logger } from "./logger";
import { VSCodeUtils } from "./utils";
import { DendronWorkspace } from "./workspace";


// === Main
// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  const ctx = "activate";
  const { logPath, extensionPath, extensionUri, storagePath, globalStoragePath } = context;

  // setup logging
  const previousVersion = context.globalState.get<string | undefined>(GLOBAL_STATE.VERSION);
  Logger.configure(context, "debug");
  Logger.info({ ctx, logPath, extensionPath, extensionUri, storagePath, globalStoragePath });
  // needs to be initialized to setup commands
  const ws = new DendronWorkspace(context);

  if (DendronWorkspace.isActive()) {
    Logger.info({ ctx: "dendron active" });
    ws.reloadWorkspace().then(() => {
      Logger.info({ ctx, msg: "engine Initialized" });
      if (_.isUndefined(context.globalState.get<string | undefined>(GLOBAL_STATE.DENDRON_FIRST_WS))) {
        Logger.info({ ctx, msg: "show welcome" });
        ws.showWelcome();
        context.globalState.update(GLOBAL_STATE.DENDRON_FIRST_WS, "initialized");
      }
    });
  } else {
    Logger.info({ ctx: "dendron not active" });
  }
  if (VSCodeUtils.isDebuggingExtension() || getStage() === "test") {
    Logger.output?.show(false);
    // TODO: check for cmd
    // const fullLogPath = FileUtils.escape(path.join(logPath, 'dendron.log'));
    // TODO
    // const cmd = `/usr/local/bin/code-insiders ${fullLogPath}`;
    // execa.command(cmd);
    // vscode.window.showInformationMessage(`logs at ${fullLogPath}`);
  }
  // TODO: don't hardcode version
  showWelcomeOrWhatsNew("0.0.1", previousVersion);
}

// this method is called when your extension is deactivated
export function deactivate() {
  const ctx = "deactivate";
  const { DendronWorkspace } = require("./workspace");
  DendronWorkspace.instance().L.info({ ctx });
}


async function showWelcomeOrWhatsNew(version: string, previousVersion: string | undefined) {
  const ctx = "showWelcomeOrWhatsNew";
  if (_.isUndefined(previousVersion)) {
    Logger.info({ ctx, msg: "first time install" });
    const ws = DendronWorkspace.instance();
    const uri = Uri.parse(path.join(ws.extensionAssetsDir, "notes", "vault.main", "dendron.md"));
    await ws.showWelcome(uri);
    await ws.context.globalState.update(GLOBAL_STATE.VERSION, version);
  } else {
    Logger.info({ ctx, msg: "not first time install" });
  }
}
