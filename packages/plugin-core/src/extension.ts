import { getStage } from "@dendronhq/common-all";
import _ from "lodash";
import * as vscode from "vscode";
import { GLOBAL_STATE, WORKSPACE_STATE, DENDRON_COMMANDS } from "./constants";
import { Logger } from "./logger";
import { HistoryService } from "./services/HistoryService";
import { VSCodeUtils } from "./utils";
import { DendronWorkspace } from "./workspace";
import semver  from 'semver' ;

// === Main
// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  const stage = getStage();
  if (stage === "test") {
    return;
  } else {
    _activate(context);
  }
}

export function _activate(context: vscode.ExtensionContext) {
  const isDebug = VSCodeUtils.isDebuggingExtension();
  const ctx = "activate";
  const stage = getStage();
  const {
    logPath,
    extensionPath,
    extensionUri,
    storagePath,
    globalStoragePath,
  } = context;
  const previousVersion = context.globalState.get<string | undefined>(
    GLOBAL_STATE.VERSION
  );
  Logger.configure(context, "debug");
  Logger.info({
    ctx,
    stage,
    isDebug,
    logPath,
    extensionPath,
    extensionUri,
    storagePath,
    globalStoragePath,
    previousVersion,
  });
  // needs to be initialized to setup commands
  const ws = new DendronWorkspace(context, {skipSetup: stage === "test"});

  if (DendronWorkspace.isActive()) {
    Logger.info({ msg: "reloadWorkspace:pre", rootDir: ws.rootDir });
    ws.reloadWorkspace().then(async () => {
      Logger.info({ ctx, msg: "dendron ready" }, true);
      // check if first time install workspace, if so, show tutorial
      if (
        _.isUndefined(
          context.globalState.get<string | undefined>(
            GLOBAL_STATE.DENDRON_FIRST_WS
          )
        )
      ) {
        Logger.info({ ctx, msg: "first dendron ws, show welcome" });
        const step = ws.context.globalState.get<string | undefined>(
          GLOBAL_STATE.DENDRON_FIRST_WS_TUTORIAL_STEP
        );
        if (_.isUndefined(step)) {
          await ws.showWelcome();
          Logger.info({ ctx, step: -1 }, true);
          await ws.updateGlobalState("DENDRON_FIRST_WS", "initialized");
          await ws.updateGlobalState("DENDRON_FIRST_WS_TUTORIAL_STEP", "0");
        } else {
          switch (step) {
            case "0":
              Logger.info({ msg: "going to step", step }, true);
              break;
            default:
              Logger.info({ msg: "", step });
          }
        }
      } else {
        Logger.info({ ctx, msg: "user finished welcome" });
      }
    });

    // check if we need to upgrade settings
    const prevWsVersion = context.workspaceState.get<string>(WORKSPACE_STATE.WS_VERSION);
    const prevGlobalVersion = ws.context.globalState.get<string>(GLOBAL_STATE.VERSION_PREV);
    if (_.isUndefined(prevGlobalVersion) || semver.lt(prevGlobalVersion, "0.30.0")) {
      Logger.info({ ctx, msg: "pre 0.30.0 version, upgrade" });
      vscode.commands.executeCommand(DENDRON_COMMANDS.UPGRADE_SETTINGS).then(changes => {
        Logger.info({ ctx, msg: "postUpgrade: new wsVersion", changes });
      });
      context.workspaceState.update(WORKSPACE_STATE.WS_VERSION, ws.version);
    }
    if (_.isUndefined(prevWsVersion)) {
      Logger.info({ ctx, msg: "first init workspace, do nothing" });
      context.workspaceState.update(WORKSPACE_STATE.WS_VERSION, ws.version);
    } else {
      if (semver.lt(prevWsVersion, ws.version)) {
        Logger.info({ ctx, msg: "preUpgrade: new wsVersion" });
        vscode.commands.executeCommand(DENDRON_COMMANDS.UPGRADE_SETTINGS).then(changes => {
          Logger.info({ ctx, msg: "postUpgrade: new wsVersion", changes });
          context.workspaceState.update(WORKSPACE_STATE.WS_VERSION, ws.version);
        });
      } else {
        Logger.info({ ctx, msg: "same wsVersion" });
      }
    }
  } else {
    Logger.info({ ctx: "dendron not active" });
  }
  if (isDebug || stage === "test") {
    Logger.output?.show(false);
    // TODO: check for cmd
    // const fullLogPath = FileUtils.escape(path.join(logPath, 'dendron.log'));
    // TODO
    // const cmd = `/usr/local/bin/code-insiders ${fullLogPath}`;
    // execa.command(cmd);
    vscode.window.showInformationMessage("activate");
  }
  showWelcomeOrWhatsNew(ws.version, previousVersion).then(() => {
    HistoryService.instance().add({ source: "extension", action: "activate" });
  });
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
    const uri = vscode.Uri.joinPath(ws.context.extensionUri, "README.md");
    await ws.context.globalState.update(GLOBAL_STATE.VERSION, version);
    await ws.context.globalState.update(GLOBAL_STATE.VERSION_PREV, "0.0.0");
    await ws.showWelcome(uri, { reuseWindow: true });
  } else {
    Logger.info({ ctx, msg: "not first time install" });
    if (version !== previousVersion) {
      Logger.info({ ctx, msg: "new version", version, previousVersion });
      await ws.context.globalState.update(GLOBAL_STATE.VERSION, version);
      await ws.context.globalState.update(GLOBAL_STATE.VERSION_PREV, previousVersion);
      vscode.window.showInformationMessage(
        `Dendron has been upgraded to ${version} from ${previousVersion}`,
        "See what changed"
      ).then(resp => {
        if (resp === "See what changed") {
          vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://github.com/dendronhq/dendron/blob/master/CHANGELOG.md#change-log'));
        }
      });
    }
  }
}
