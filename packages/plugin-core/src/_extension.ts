import { launchv2, ServerUtils, SubProcessExitType } from "@dendronhq/api-server";
import {
  CONSTANTS,
  DendronError,
  getStage,
  Time,
  VaultUtils,
  VSCodeEvents,
  InstallStatus
} from "@dendronhq/common-all";
import {
  getDurationMilliseconds,
  getOS,
  SegmentClient
} from "@dendronhq/common-server";
import {
  DConfig,
  HistoryService,
  MetadataService,
  MigrationServce,
  WorkspaceService
} from "@dendronhq/engine-server";
import { ExecaChildProcess } from "execa";
import _ from "lodash";
import { Duration } from "luxon";
import path from "path";
import semver from "semver";
import * as vscode from "vscode";
import { CONFIG, DendronContext, DENDRON_COMMANDS } from "./constants";
import { Logger } from "./logger";
import { migrateConfig } from "./migration";
import { StateService } from "./services/stateService";
import { Extensions } from "./settings";
import { setupSegmentClient } from "./telemetry";
import { VSCodeUtils, WSUtils } from "./utils";
import { AnalyticsUtils } from "./utils/analytics";
import { DendronTreeView } from "./views/DendronTreeView";
import { DendronWorkspace, getEngine, getWS } from "./workspace";
import { WorkspaceInitFactory } from "./workspace/workspaceInitializer";

const MARKDOWN_WORD_PATTERN = new RegExp("([\\w\\.\\#]+)");
// === Main

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  const stage = getStage();
  DendronTreeView.register(context);
  // override default word pattern
  vscode.languages.setLanguageConfiguration("markdown", {
    wordPattern: MARKDOWN_WORD_PATTERN,
  });
  if (stage !== "test") {
    _activate(context).catch((err) => {
      Logger.error(err);
      HistoryService.instance().add({
        action: "not_initialized",
        source: "extension",
        data: { err },
      });
    });
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

  // Run any initialization code necessary for this workspace invocation.
  const initializer = WorkspaceInitFactory.create(ws);

  if (initializer?.onWorkspaceOpen) {
    initializer.onWorkspaceOpen({ ws });
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
  const previousWsVersion = StateService.instance().getWorkspaceVersion();
  // stats
  // NOTE: this is legacy to upgrade .code-workspace specific settings
  // we are moving everything to dendron.yml
  // see [[2021 06 Deprecate Workspace Settings|proj.2021-06-deprecate-workspace-settings]]
  if (previousWsVersion === CONSTANTS.DENDRON_INIT_VERSION) {
    Logger.info({ ctx, msg: "no previous global version" });
    vscode.commands
      .executeCommand(DENDRON_COMMANDS.UPGRADE_SETTINGS.key)
      .then((changes) => {
        Logger.info({ ctx, msg: "postUpgrade: new wsVersion", changes });
      });
    await StateService.instance().setWorkspaceVersion(
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
        await StateService.instance().setWorkspaceVersion(
          DendronWorkspace.version()
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

async function startServerProcess(): Promise<{
  port: number;
  subprocess?: ExecaChildProcess;
}> {
  const { nextServerUrl, nextStaticRoot, engineServerPort } =
    getWS().config.dev || {};
  // const ctx = "startServer";
  const maybePort =
    DendronWorkspace.configuration().get<number | undefined>(
      CONFIG.SERVER_PORT.key
    ) || engineServerPort;
  const port = maybePort;
  if (port) {
    return { port };
  }

  // if in dev mode, simplify debugging without going multi process
  if (getStage() !== "prod") {
    const out = await launchv2({
      logPath: path.join(__dirname, "..", "..", "dendron.server.log"),
    });
    return {port: out.port}
  }

  // start server is separate process
  const logPath = DendronWorkspace.instance().context.logPath;
  const out = await ServerUtils.execServerNode({
    scriptPath: path.join(__dirname, "server.js"),
    logPath,
    nextServerUrl,
    nextStaticRoot,
    port,
  });
  return out;
}

export async function _activate(
  context: vscode.ExtensionContext
): Promise<boolean> {
  const startActivate = process.hrtime();
  const isDebug = VSCodeUtils.isDevMode();
  const ctx = "_activate";
  const stage = getStage();
  const { workspaceFile, workspaceFolders } = vscode.workspace;
  const logLevel = process.env["LOG_LEVEL"];
  const { logPath, extensionPath, extensionUri, storagePath } = context;
  const stateService = new StateService({
    globalState: context.globalState,
    workspaceState: context.workspaceState,
  });

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

  // Setup the workspace trust callback to detect changes from the user's workspace trust settings
  vscode.workspace.onDidGrantWorkspaceTrust(() => {
    getEngine().trustedWorkspace = vscode.workspace.isTrusted;
  });

  //  needs to be initialized to setup commands
  const ws = DendronWorkspace.getOrCreate(context, {
    skipSetup: stage === "test",
  });

  const currentVersion = DendronWorkspace.version();
  const previousWorkspaceVersion = stateService.getWorkspaceVersion();
  const previousGlobalVersion = stateService.getGlobalVersion();
  const extensionInstallStatus = VSCodeUtils.getInstallStatusForExtension({
    previousGlobalVersion,
    currentVersion,
  });

  if (DendronWorkspace.isActive()) {
    const start = process.hrtime();
    let dendronConfig = ws.config;
    const wsConfig = await ws.getWorkspaceSettings();
    // --- Get Version State
    const workspaceInstallStatus = VSCodeUtils.getInstallStatusForWorkspace({
      previousWorkspaceVersion,
      currentVersion,
    });
    const wsRoot = DendronWorkspace.wsRoot() as string;
    const wsService = new WorkspaceService({ wsRoot });

    // we changed how we track upgrades. this makes sure everyone has their workspace version set initially
    let forceUpgrade = false;
    try {
      const maybeRaw = DConfig.getRaw(wsRoot);
      if (
        _.isUndefined(maybeRaw.journal) &&
        workspaceInstallStatus === InstallStatus.INITIAL_INSTALL
      ) {
        forceUpgrade = true;
        Logger.info({ ctx, forceUpgrade });
      }
    } catch (error) {
      console.error(error);
    }

    if (MigrationServce.shouldRunMigration({force: forceUpgrade, workspaceInstallStatus})) {
      const changes = await MigrationServce.applyMigrationRules({
        currentVersion,
        previousVersion: previousWorkspaceVersion,
        dendronConfig,
        wsConfig,
        wsService,
        logger: Logger,
      });
      // if changes were made, use updated changes in subsequent configuration
      if (!_.isEmpty(changes)) {
        const { data } = _.last(changes)!;
        dendronConfig = data.dendronConfig;
      }
    }

    // initialize client
    setupSegmentClient(ws);
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
    const configMigrated = migrateConfig({ config: dendronConfig, wsRoot });
    Logger.info({
      ctx,
      config: dendronConfig,
      configMigrated,
      msg: "read dendron config",
    });

    // check for vaults with same name
    const uniqVaults = _.uniqBy(dendronConfig.vaults, (vault) =>
      VaultUtils.getName(vault)
    );
    if (_.size(uniqVaults) < _.size(dendronConfig.vaults)) {
      const txt = "Fix it";
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
    wsService.writeMeta({ version: DendronWorkspace.version() });

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
      installStatus: workspaceInstallStatus,
      currentVersion,
      previousWorkspaceVersion,
      previousGlobalVersion,
      platform,
      extensions,
      vaults: ws.vaultsv4,
    });

    // --- Start Initializating the Engine
    WSUtils.showInitProgress();

    const { port, subprocess } = await startServerProcess();
    if (subprocess) {
      WSUtils.handleServerProcess({
        subprocess,
        context,
        onExit: (type: SubProcessExitType) => {
          const txt = "Restart Dendron";
          vscode.window
            .showErrorMessage("Dendron engine encountered an error", txt)
            .then(async (resp) => {
              if (resp === txt) {
                AnalyticsUtils.track(VSCodeEvents.ServerCrashed, {code: type});
                _activate(context);
              }
            });
        },
      });
    }
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

    MetadataService.instance().setDendronWorkspaceActivated();

    AnalyticsUtils.identify();
    AnalyticsUtils.track(VSCodeEvents.InitializeWorkspace, {
      duration: durationReloadWorkspace,
      noCaching: dendronConfig.noCaching || false,
      numNotes,
      numVaults: _.size(getEngine().vaults),
    });
    if (stage !== "test") {
      await ws.activateWatchers();
      toggleViews(true);
    }
    Logger.info({ ctx, msg: "fin startClient", durationReloadWorkspace });
  } else {
    // ws not active
    Logger.info({ ctx: "dendron not active" });
    toggleViews(false);
  }

  return showWelcomeOrWhatsNew({
    extensionInstallStatus,
    version: DendronWorkspace.version(),
    previousExtensionVersion: previousWorkspaceVersion,
    start: startActivate,
  }).then(() => {
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

async function showWelcomeOrWhatsNew({
  extensionInstallStatus,
  version,
  previousExtensionVersion,
  start,
}: {
  extensionInstallStatus: InstallStatus;
  version: string;
  previousExtensionVersion: string;
  start: [number, number];
}) {
  const ctx = "showWelcomeOrWhatsNew";
  Logger.info({ ctx, version, previousExtensionVersion });
  const ws = DendronWorkspace.instance();
  switch (extensionInstallStatus) {
    case InstallStatus.INITIAL_INSTALL: {
      Logger.info({ ctx, msg: "extension, initial install" });
      MetadataService.instance().setInitialInstall();

      AnalyticsUtils.track(VSCodeEvents.Install, {
        duration: getDurationMilliseconds(start),
      });
      await StateService.instance().setGlobalVersion(version);

      // if user hasn't opted out of telemetry, notify them about it
      if (!SegmentClient.instance().hasOptedOut) {
        StateService.instance().showTelemetryNotice();
      }

      await ws.showWelcome();
      break;
    }
    case InstallStatus.UPGRADED: {
      Logger.info({
        ctx,
        msg: "extension, new version",
        version,
        previousExtensionVersion,
      });
      await StateService.instance().setGlobalVersion(version);
      AnalyticsUtils.track(VSCodeEvents.Upgrade, {
        previousVersion: previousExtensionVersion,
        duration: getDurationMilliseconds(start),
      });
      vscode.window
        .showInformationMessage(
          `Dendron has been upgraded to ${version} from ${previousExtensionVersion}`,
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
      break;
    }
    default:
      // no change
      break;
  }

  //TODO: Re-enable lapsed user message after a one-week grace period of having
  //users activate their dendron workspaces
  // eslint-disable-next-line no-constant-condition
  if (false && shouldDisplayLapsedUserMsg()) {
    showLapsedUserMessage();
  }
}

function showLapsedUserMessage() {
  const START_TITLE = "Get Started";

  AnalyticsUtils.track(VSCodeEvents.ShowLapsedUserMessage);
  MetadataService.instance().setLapsedUserMsgSendTime();

  vscode.window
    .showInformationMessage(
      "Get started with Dendron.",
      { modal: true },
      { title: START_TITLE }
    )
    .then((resp) => {
      if (resp?.title === START_TITLE) {
        AnalyticsUtils.track(VSCodeEvents.LapsedUserMessageAccepted);
        const ws = getWS();
        return ws.showWelcome();
      } else {
        AnalyticsUtils.track(VSCodeEvents.LapsedUserMessageRejected);
        return;
      }
    });
}

/**
 * Visible for Testing purposes only
 * @returns
 */
export function shouldDisplayLapsedUserMsg(): boolean {
  const ONE_DAY = Duration.fromObject({ days: 1 });
  const ONE_WEEK = Duration.fromObject({ weeks: 1 });
  const CUR_TIME = Duration.fromObject({ seconds: Time.now().toSeconds() });
  const metaData = MetadataService.instance().getMeta();

  // If we haven't prompted the user yet and it's been a day since their
  // initial install OR if it's been one week since we last prompted the user
  const refreshMsg =
    (metaData.lapsedUserMsgSendTime === undefined &&
      ONE_DAY <=
        CUR_TIME.minus(
          Duration.fromObject({ seconds: metaData.firstInstall })
        )) ||
    (metaData.lapsedUserMsgSendTime !== undefined &&
      ONE_WEEK <=
        CUR_TIME.minus(
          Duration.fromObject({ seconds: metaData.lapsedUserMsgSendTime })
        ));

  // If the user has never initialized and it's time to refresh the lapsed user
  // message
  return !metaData.firstWsInitialize && refreshMsg;
}
