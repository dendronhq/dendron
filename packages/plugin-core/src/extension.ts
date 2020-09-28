import { getStage } from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import semver from "semver";
import * as vscode from "vscode";
import {
  CONFIG,
  DENDRON_COMMANDS,
  GLOBAL_STATE,
  WORKSPACE_STATE,
} from "./constants";
import { Logger } from "./logger";
import { startClient } from "./lsp";
import { HistoryService } from "./services/HistoryService";
import { Extensions } from "./settings";
import { VSCodeUtils } from "./utils";
import { MarkdownUtils } from "./utils/md";
import { getOS } from "./utils/system";
import { DendronTreeView } from "./views/DendronTreeView";
import { DendronWorkspace } from "./workspace";

// === Main
// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  const stage = getStage();
  DendronTreeView.register(context);
  if (stage !== "test") {
    _activate(context);
  }
  return;
}

export async function _activate(context: vscode.ExtensionContext) {
  const isDebug = VSCodeUtils.isDebuggingExtension();
  const ctx = "activate";
  const stage = getStage();
  const { logPath, extensionPath, extensionUri, storagePath } = context;

  Logger.configure(context, "debug");
  Logger.info({
    ctx,
    stage,
    isDebug,
    logPath,
    extensionPath,
    extensionUri,
    storagePath,
  });
  // needs to be initialized to setup commands
  const ws = DendronWorkspace.getOrCreate(context, {
    skipSetup: stage === "test",
  });

  const installedGlobalVersion = DendronWorkspace.version();
  const migratedGlobalVersion = context.globalState.get<string | undefined>(
    GLOBAL_STATE.VERSION
  );
  const previousGlobalVersion = ws.context.globalState.get<string | undefined>(
    GLOBAL_STATE.VERSION_PREV
  );
  const previousWsVersion =
    context.workspaceState.get<string>(WORKSPACE_STATE.WS_VERSION) || "0.0.0";
  // stats
  const platform = getOS();
  const extensions = Extensions.getVSCodeExtnsion().map(
    ({ id, extension: ext }) => {
      return {
        id,
        version: ext?.packageJSON?.version,
        active: ext?.isActive,
      };
    }
  );

  const workspace = ws.rootWorkspace.uri.fsPath;
  Logger.info({
    ctx,
    installedGlobalVersion,
    migratedGlobalVersion,
    previousGlobalVersion,
    previousWsVersion,
    platform,
    extensions,
    workspace,
  });

  if (DendronWorkspace.isActive()) {
    const lspSupport = DendronWorkspace.configuration().get(
      CONFIG.USE_EXPERIMENTAL_LSP_SUPPORT.key
    );
    Logger.info({ ctx, msg: "wsActive", lspSupport });
    if (lspSupport) {
      Logger.info({ ctx, msg: "start with lsp support" });
      await DendronWorkspace.instance().activateWorkspace();
      startClient(context);
      Logger.info({ ctx, msg: "exit" });
      return;
    } else {
      // startClient(context);
      ws.reloadWorkspace().then(async () => {
        Logger.info({ ctx, msg: "dendron ready" }, true);
        // help with debug
        fs.readJSON(DendronWorkspace.workspaceFile().fsPath).then((config) => {
          Logger.info({ ctx, msg: "gotConfig", config });
        });
        // check if first time install workspace, if so, show tutorial
        if (
          _.isUndefined(
            context.globalState.get<string | undefined>(
              GLOBAL_STATE.DENDRON_FIRST_WS
            )
          )
        ) {
          Logger.info({ ctx, msg: "first dendron ws, show welcome" });
          const welcomeUri = vscode.Uri.joinPath(
            ws.rootWorkspace.uri,
            "dendron.quickstart.md"
          );
          if (getStage() !== "test" && fs.pathExistsSync(welcomeUri.fsPath)) {
            await vscode.window.showTextDocument(welcomeUri);
            await MarkdownUtils.openPreview({ reuseWindow: false });
          }
          await ws.updateGlobalState("DENDRON_FIRST_WS", "initialized");
        }
        HistoryService.instance().add({
          source: "extension",
          action: "initialized",
        });
        vscode.window.showInformationMessage("Dendron is active");
        Logger.info({ ctx, msg: "finish reloadWorkspace" });
      });
    }
    // first time install
    if (previousGlobalVersion === "0.0.0") {
      Logger.info({ ctx, msg: "no previous global version" });
      vscode.commands
        .executeCommand(DENDRON_COMMANDS.UPGRADE_SETTINGS.key)
        .then((changes) => {
          Logger.info({ ctx, msg: "postUpgrade: new wsVersion", changes });
        });
      context.workspaceState.update(
        WORKSPACE_STATE.WS_VERSION,
        DendronWorkspace.version()
      );
    } else {
      const newVersion = DendronWorkspace.version();
      if (semver.lt(previousWsVersion, newVersion)) {
        Logger.info({ ctx, msg: "preUpgrade: new wsVersion" });
        vscode.commands
          .executeCommand(DENDRON_COMMANDS.UPGRADE_SETTINGS.key)
          .then(async (changes) => {
            Logger.info({
              ctx,
              msg: "postUpgrade: new wsVersion",
              changes,
              previousWsVersion,
              newVersion,
            });
            await context.workspaceState.update(
              WORKSPACE_STATE.WS_VERSION,
              newVersion
            );
            HistoryService.instance().add({
              source: "extension",
              action: "upgraded",
            });
          });
      } else {
        Logger.info({ ctx, msg: "same wsVersion" });
      }
    }

    // exit
    Logger.info({ ctx, msg: "exit" });
  } else {
    // ws not active
    Logger.info({ ctx: "dendron not active" });
  }

  showWelcomeOrWhatsNew(DendronWorkspace.version(), migratedGlobalVersion).then(
    () => {
      HistoryService.instance().add({
        source: "extension",
        action: "activate",
      });
    }
  );
}

// this method is called when your extension is deactivated
export function deactivate() {
  const ctx = "deactivate";
  const ws = DendronWorkspace.instance();
  ws.deactivate();
  ws.L.info({ ctx });
}

async function showWelcomeOrWhatsNew(
  version: string,
  previousVersion: string | undefined
) {
  const ctx = "showWelcomeOrWhatsNew";
  Logger.info({ ctx, version, previousVersion });
  const ws = DendronWorkspace.instance();
  if (_.isUndefined(previousVersion)) {
    Logger.info({ ctx, msg: "first time install" });
    // NOTE: this needs to be from extension because no workspace might exist at this point
    const uri = vscode.Uri.joinPath(
      ws.context.extensionUri,
      "assets",
      "dendronWS",
      "vault",
      "dendron.welcome.md"
    );
    await ws.context.globalState.update(GLOBAL_STATE.VERSION, version);
    await ws.context.globalState.update(GLOBAL_STATE.VERSION_PREV, "0.0.0");
    await ws.showWelcome(uri, { reuseWindow: true });
  } else {
    Logger.info({ ctx, msg: "not first time install" });
    if (version !== previousVersion) {
      Logger.info({ ctx, msg: "new version", version, previousVersion });
      await ws.context.globalState.update(GLOBAL_STATE.VERSION, version);
      await ws.context.globalState.update(
        GLOBAL_STATE.VERSION_PREV,
        previousVersion
      );
      vscode.window
        .showInformationMessage(
          `Dendron has been upgraded to ${version} from ${previousVersion}`,
          "See what changed"
        )
        .then((resp) => {
          if (resp === "See what changed") {
            vscode.commands.executeCommand(
              "vscode.open",
              vscode.Uri.parse(
                "https://github.com/dendronhq/dendron/blob/master/CHANGELOG.md#change-log"
              )
            );
          }
        });
    }
  }
}
