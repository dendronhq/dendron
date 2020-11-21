import { launch } from "@dendronhq/api-server";
import { getStage, Time } from "@dendronhq/common-all";
import { readJSONWithComments } from "@dendronhq/common-server";
import { getWSMetaFilePath, writeWSMetaFile } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import semver from "semver";
import * as vscode from "vscode";
import {
  CONFIG,
  DENDRON_COMMANDS,
  GLOBAL_STATE,
  WORKSPACE_STATE,
} from "./constants";
import { Logger } from "./logger";
import { migrateConfig } from "./migration";
import { HistoryEvent, HistoryService } from "./services/HistoryService";
import { Extensions } from "./settings";
import { VSCodeUtils, WSUtils } from "./utils";
import { MarkdownUtils } from "./utils/md";
import { getOS } from "./utils/system";
import { DendronTreeViewV2 } from "./views/DendronTreeViewV2";
import { DendronWorkspace } from "./workspace";

// === Main
// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  const stage = getStage();
  DendronTreeViewV2.register(context);
  if (stage !== "test") {
    _activate(context);
  }
  return;
}

async function reloadWorkspace() {
  const ctx = "reloadWorkspace";
  const ws = DendronWorkspace.instance();
  const maybeEngine = await ws.reloadWorkspace();
  if (!maybeEngine) {
    return maybeEngine;
  }
  Logger.info({ ctx, msg: "post-ws.reloadWorkspace" });
  // help with debug, doesn't need to block
  readJSONWithComments(DendronWorkspace.workspaceFile().fsPath).then(
    (config) => {
      Logger.info({ ctx, msg: "configDump", config });
    }
  );
  // check if first time install workspace, if so, show tutorial
  if (isFirstInstall(ws.context)) {
    Logger.info({ ctx, msg: "first dendron ws, show welcome" });
    const welcomeUri = vscode.Uri.joinPath(ws.rootWorkspace.uri, "dendron.md");
    if (getStage() !== "test" && fs.pathExistsSync(welcomeUri.fsPath)) {
      await vscode.window.showTextDocument(welcomeUri);
      await MarkdownUtils.openPreview({ reuseWindow: false });
    }
    await ws.updateGlobalState("DENDRON_FIRST_WS", "initialized");
  }
  vscode.window.showInformationMessage("Dendron is active");
  Logger.info({ ctx, msg: "exit" });
  await postReloadWorkspace();
  HistoryService.instance().add({
    source: "extension",
    action: "initialized",
  });
  return maybeEngine;
}

async function postReloadWorkspace() {
  const ctx = "postReloadWorkspace";
  const ws = DendronWorkspace.instance();
  const previousGlobalVersion = ws.context.globalState.get<string | undefined>(
    GLOBAL_STATE.VERSION_PREV
  );
  const previousWsVersion =
    ws.context.workspaceState.get<string>(WORKSPACE_STATE.WS_VERSION) ||
    "0.0.0";
  // stats
  if (previousGlobalVersion === "0.0.0") {
    Logger.info({ ctx, msg: "no previous global version" });
    vscode.commands
      .executeCommand(DENDRON_COMMANDS.UPGRADE_SETTINGS.key)
      .then((changes) => {
        Logger.info({ ctx, msg: "postUpgrade: new wsVersion", changes });
      });
    ws.context.workspaceState.update(
      WORKSPACE_STATE.WS_VERSION,
      DendronWorkspace.version()
    );
  } else {
    const newVersion = DendronWorkspace.version();
    if (semver.lt(previousWsVersion, newVersion)) {
      let changes: any;
      Logger.info({ ctx, msg: "preUpgrade: new wsVersion" });
      try {
        changes = await vscode.commands.executeCommand(
          DENDRON_COMMANDS.UPGRADE_SETTINGS.key
        );
        Logger.info({
          ctx,
          msg: "postUpgrade: new wsVersion",
          changes,
          previousWsVersion,
          newVersion,
        });
        await ws.context.workspaceState.update(
          WORKSPACE_STATE.WS_VERSION,
          newVersion
        );
      } catch (err) {
        Logger.error({ msg: "error upgrading", err: JSON.stringify(err) });
        return;
      }
      HistoryService.instance().add({
        source: "extension",
        action: "upgraded",
        data: { changes },
      });
    } else {
      Logger.info({ ctx, msg: "same wsVersion" });
    }
  }
  Logger.info({ ctx, msg: "exit" });
}

function isFirstInstall(context: vscode.ExtensionContext): boolean {
  return _.isUndefined(
    context.globalState.get<string | undefined>(GLOBAL_STATE.DENDRON_FIRST_WS)
  );
}

async function startServer() {
  const maybePort = DendronWorkspace.configuration().get<number | undefined>(
    CONFIG.SERVER_PORT.key
  );
  const logPath = DendronWorkspace.instance().context.logPath;
  if (!maybePort) {
    return await launch({
      port: maybePort,
      logPath: path.join(logPath, "dendron.server.log"),
    });
  }
  return maybePort;
}

// @ts-ignore
function subscribeToPortChange() {
  const ctx = "subscribeToPortChange";
  HistoryService.instance().subscribe(
    "apiServer",
    async (event: HistoryEvent) => {
      if (event.action === "changedPort") {
        const port = DendronWorkspace.serverConfiguration().serverPort;
        const engine = WSUtils.updateEngineAPI(port);
        await engine.init();
        Logger.info({ ctx, msg: "fin init Engine" });
        await reloadWorkspace();
      }
    }
  );
}

export async function _activate(context: vscode.ExtensionContext) {
  const isDebug = VSCodeUtils.isDebuggingExtension();
  const ctx = "_activate";
  const stage = getStage();
  const { workspaceFile, workspaceFolders } = vscode.workspace;
  const { logPath, extensionPath, extensionUri, storagePath } = context;
  Logger.info({
    ctx,
    stage,
    isDebug,
    logPath,
    extensionPath,
    extensionUri,
    storagePath,
    workspaceFile,
    workspaceFolders,
  });
  // needs to be initialized to setup commands
  const ws = DendronWorkspace.getOrCreate(context, {
    skipSetup: stage === "test",
  });
  const migratedGlobalVersion = context.globalState.get<string | undefined>(
    GLOBAL_STATE.VERSION
  );
  if (DendronWorkspace.isActive()) {
    const config = ws.config;
    const wsRoot = DendronWorkspace.wsRoot() as string;

    // migrate legacy config files
    const configMigrated = migrateConfig({ config, wsRoot });
    Logger.info({ ctx, config, msg: "isActive", configMigrated });

    const fpath = getWSMetaFilePath({ wsRoot });
    writeWSMetaFile({
      fpath,
      data: {
        version: DendronWorkspace.version(),
        activationTime: Time.now().toMillis(),
      },
    });
    const installedGlobalVersion = DendronWorkspace.version();
    const previousGlobalVersion = ws.context.globalState.get<
      string | undefined
    >(GLOBAL_STATE.VERSION_PREV);
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

    Logger.info({
      ctx,
      installedGlobalVersion,
      migratedGlobalVersion,
      previousGlobalVersion,
      previousWsVersion,
      platform,
      extensions,
      vaults: ws.vaults,
    });

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Starting Dendron...",
        cancellable: true,
      },
      (_progress, token) => {
        token.onCancellationRequested(() => {
          console.log("Cancelled");
        });

        const p = new Promise((resolve) => {
          HistoryService.instance().subscribe(
            "extension",
            async (_event: HistoryEvent) => {
              if (_event.action === "initialized") {
                resolve();
              }
            }
          );
        });
        return p;
      }
    );
    const port: number = await startServer();
    Logger.info({ ctx, msg: "post-start-server", port });
    WSUtils.updateEngineAPI(port);
    // startLSPClient({ context, port });
    const reloadSuccess = await reloadWorkspace();
    if (!reloadSuccess) {
      HistoryService.instance().add({
        source: "extension",
        action: "not_initialized",
      });
      return;
    }
    await ws.activateWatchers();
    Logger.info({ ctx, msg: "fin startClient" });
  } else {
    // ws not active
    Logger.info({ ctx: "dendron not active" });
    return false;
  }

  showWelcomeOrWhatsNew(DendronWorkspace.version(), migratedGlobalVersion).then(
    () => {
      HistoryService.instance().add({
        source: "extension",
        action: "activate",
      });
    }
  );
  return true;
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
                "https://dendron.so/notes/9bc92432-a24c-492b-b831-4d5378c1692b.html"
              )
            );
          }
        });
    }
  }
}
