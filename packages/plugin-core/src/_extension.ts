import {
  DendronError,
  getStage,
  VaultUtils,
  VSCodeEvents,
  WorkspaceSettings,
} from "@dendronhq/common-all";
import {
  getDurationMilliseconds,
  getOS,
  readJSONWithComments,
  SegmentClient,
} from "@dendronhq/common-server";
import {
  HistoryEvent,
  HistoryService,
  WorkspaceService,
} from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import semver from "semver";
import * as vscode from "vscode";
import {
  CONFIG,
  DendronContext,
  DENDRON_COMMANDS,
  GLOBAL_STATE,
  WORKSPACE_STATE,
} from "./constants";
import { Logger } from "./logger";
import { migrateConfig, migrateSettings } from "./migration";
import { Extensions } from "./settings";
import { VSCodeUtils, WSUtils } from "./utils";
import { AnalyticsUtils } from "./utils/analytics";
import { MarkdownUtils } from "./utils/md";
import { DendronTreeView } from "./views/DendronTreeView";
import { DendronWorkspace, getEngine, getWS } from "./workspace";
const MARKDOWN_WORD_PATTERN = new RegExp("([\\w\\.\\#]+)");
// === Main

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  const stage = getStage();
  console.log("process.env", process.env);
  console.log("stage", stage);
  DendronTreeView.register(context);
  // override default word pattern
  vscode.languages.setLanguageConfiguration("markdown", {
    wordPattern: MARKDOWN_WORD_PATTERN,
  });
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
  // check if first time install workspace, if so, show tutorial
  if (isFirstInstall(ws.context)) {
    Logger.info({ ctx, msg: "first dendron ws, show welcome" });
    const welcomeUri = VSCodeUtils.joinPath(ws.rootWorkspace.uri, "dendron.md");
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
        Logger.error({
          msg: "error upgrading",
          error: new DendronError({ message: JSON.stringify(err) }),
        });
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
  const ctx = "startServer";
  const { nextServerUrl, nextStaticRoot, engineServerPort } =
    getWS().config.dev || {};
  const maybePort =
    DendronWorkspace.configuration().get<number | undefined>(
      CONFIG.SERVER_PORT.key
    ) || engineServerPort;
  const logPath = DendronWorkspace.instance().context.logPath;
  Logger.info({ ctx: ctx, logLevel: process.env["LOG_LEVEL"], maybePort });
  if (!maybePort) {
    const { launchv2 } = require("@dendronhq/api-server");
    return await launchv2({
      port: maybePort,
      logPath: path.join(logPath, "dendron.server.log"),
      nextServerUrl,
      nextStaticRoot,
    });
  }
  return { port: maybePort };
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

export async function _activate(
  context: vscode.ExtensionContext
): Promise<boolean> {
  const isDebug = VSCodeUtils.isDevMode();
  const ctx = "_activate";
  const stage = getStage();
  const { workspaceFile, workspaceFolders } = vscode.workspace;
  const logLevel = process.env["LOG_LEVEL"];
  const { logPath, extensionPath, extensionUri, storagePath } = context;
  Logger.info({
    ctx,
    stage,
    isDebug,
    logPath,
    logLevel,
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
    let start = process.hrtime();
    const config = ws.config;
    // initialize client
    SegmentClient.instance({ optOut: ws.config.noTelemetry, forceNew: true });
    const wsRoot = DendronWorkspace.wsRoot() as string;
    const wsService = new WorkspaceService({ wsRoot });
    const didClone = await wsService.initialize({
      onSyncVaultsProgress: () => {
        vscode.window.showInformationMessage(
          "found empty remote vaults that need initializing"
        );
      },
      onSyncVaultsEnd: () => {
        vscode.window.showInformationMessage(
          "finish initializing remote vaults. reloading workspace"
        );
        setTimeout(VSCodeUtils.reloadWindow, 200);
      },
    });
    if (didClone) {
      return false;
    }

    ws.workspaceService = wsService;
    const configMigrated = migrateConfig({ config, wsRoot });
    Logger.info({ ctx, config, configMigrated, msg: "read dendron config" });

    // check for vaults with same name
    const uniqVaults = _.uniqBy(config.vaults, (vault) =>
      VaultUtils.getName(vault)
    );
    if (_.size(uniqVaults) < _.size(config.vaults)) {
      let txt = "Fix it";
      await vscode.window
        .showErrorMessage(
          "Multiple Vaults with the same name. See https://dendron.so/notes/a6c03f9b-8959-4d67-8394-4d204ab69bfe.html#multiple-vaults-with-the-same-name to fix",
          txt
        )
        .then((resp) => {
          if (resp === txt) {
            vscode.commands.executeCommand(
              "vscode.open",
              vscode.Uri.parse(
                "https://dendron.so/notes/a6c03f9b-8959-4d67-8394-4d204ab69bfe.html#multiple-vaults-with-the-same-name"
              )
            );
          }
        });
      return false;
    }

    // migrate legacy settings
    const wsConfig = (await readJSONWithComments(
      DendronWorkspace.workspaceFile().fsPath
    )) as WorkspaceSettings;
    const wsConfigMigrated = migrateSettings({ settings: wsConfig, config });
    Logger.info({ ctx, wsConfig, wsConfigMigrated, msg: "read wsConfig" });
    wsService.writeMeta({ version: DendronWorkspace.version() });

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
      vaults: ws.vaultsv4,
    });

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Starting Dendron...",
        cancellable: true,
      },
      (_progress, _token) => {
        _token.onCancellationRequested(() => {
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
    const { port } = await startServer();
    const durationStartServer = getDurationMilliseconds(start);
    Logger.info({ ctx, msg: "post-start-server", port, durationStartServer });
    WSUtils.updateEngineAPI(port);
    wsService.writePort(port);
    const reloadSuccess = await reloadWorkspace();
    const durationReloadWorkspace = getDurationMilliseconds(start);

    if (!reloadSuccess) {
      HistoryService.instance().add({
        source: "extension",
        action: "not_initialized",
      });
      return false;
    }

    if (VSCodeUtils.isDevMode()) {
      vscode.commands.executeCommand(
        "setContext",
        DendronContext.DEV_MODE,
        true
      );
    }

    // round to nearest 10th
    let numNotes = _.size(getEngine().notes);
    if (numNotes > 10) {
      numNotes = Math.round(numNotes / 10) * 10;
    }

    AnalyticsUtils.identify();
    AnalyticsUtils.track(VSCodeEvents.InitializeWorkspace, {
      duration: durationReloadWorkspace,
      noCaching: config.noCaching || false,
      numNotes,
      numVaults: _.size(getEngine().vaults),
    });
    await ws.activateWatchers();
    toggleViews(true);
    Logger.info({ ctx, msg: "fin startClient", durationReloadWorkspace });
  } else {
    // ws not active
    Logger.info({ ctx: "dendron not active" });
    toggleViews(false);
  }

  return showWelcomeOrWhatsNew(
    DendronWorkspace.version(),
    migratedGlobalVersion
  ).then(() => {
    if (DendronWorkspace.isActive()) {
      HistoryService.instance().add({
        source: "extension",
        action: "activate",
      });
    }
    return false;
  });
}

function toggleViews(enabled: boolean) {
  const ctx = "toggleViews";
  Logger.info({ ctx, msg: `views enabled: ${enabled}` });
  VSCodeUtils.setContext(DendronContext.PLUGIN_ACTIVE, enabled);
}

// this method is called when your extension is deactivated
export function deactivate() {
  const ctx = "deactivate";
  const ws = DendronWorkspace.instance();
  ws.deactivate();
  ws.L.info({ ctx });

  toggleViews(false);
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
    const uri = VSCodeUtils.joinPath(
      ws.context.extensionUri,
      "assets",
      "dendron-ws",
      "vault",
      "welcome.html"
    );
    AnalyticsUtils.track(VSCodeEvents.Install);
    await ws.context.globalState.update(GLOBAL_STATE.VERSION, version);
    await ws.context.globalState.update(GLOBAL_STATE.VERSION_PREV, "0.0.0");
    vscode.window
      .showInformationMessage(
        `Dendron collects limited usage data to help improve the quality of our software`,
        "See Details",
        "Opt Out"
      )
      .then((resp) => {
        if (resp === "See Details") {
          VSCodeUtils.openLink(
            "https://wiki.dendron.so/notes/84df871b-9442-42fd-b4c3-0024e35b5f3c.html"
          );
        }
        if (resp === "Opt Out") {
          VSCodeUtils.openLink(
            "https://wiki.dendron.so/notes/84df871b-9442-42fd-b4c3-0024e35b5f3c.html#how-to-opt-out-of-data-collection"
          );
        }
      });
    await ws.showWelcome(uri, { reuseWindow: true, rawHTML: true });
  } else {
    Logger.info({ ctx, msg: "not first time install" });
    if (version !== previousVersion) {
      Logger.info({ ctx, msg: "new version", version, previousVersion });
      await ws.context.globalState.update(GLOBAL_STATE.VERSION, version);
      await ws.context.globalState.update(
        GLOBAL_STATE.VERSION_PREV,
        previousVersion
      );
      AnalyticsUtils.track(VSCodeEvents.Upgrade, {
        previousVersion,
      });
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
