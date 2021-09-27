import {
  launchv2,
  ServerUtils,
  SubProcessExitType,
} from "@dendronhq/api-server";
import {
  CONSTANTS,
  DendronError,
  ExtensionEvents,
  getStage,
  InstallStatus,
  Time,
  VaultUtils,
  VSCodeEvents,
  WorkspaceType,
} from "@dendronhq/common-all";
import {
  getDurationMilliseconds,
  getOS,
  SegmentClient,
  writeJSONWithComments,
} from "@dendronhq/common-server";
import {
  HistoryService,
  MetadataService,
  WorkspaceService,
  WorkspaceUtils,
} from "@dendronhq/engine-server";
import { RewriteFrames } from "@sentry/integrations";
import * as Sentry from "@sentry/node";
import { ExecaChildProcess } from "execa";
import fs from "fs-extra";
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
import { GOOGLE_OAUTH_ID, GOOGLE_OAUTH_SECRET } from "./types/global";
import { KeybindingUtils, VSCodeUtils, WSUtils } from "./utils";
import { AnalyticsUtils } from "./utils/analytics";
import { DendronTreeView } from "./views/DendronTreeView";
import {
  DendronExtension,
  getDWorkspace,
  getEngine,
  getExtension,
} from "./workspace";
import { DendronCodeWorkspace } from "./workspace/codeWorkspace";
import { DendronNativeWorkspace } from "./workspace/nativeWorkspace";
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
  const ws = getDWorkspace();
  const maybeEngine = await WSUtils.reloadWorkspace();
  if (!maybeEngine) {
    return maybeEngine;
  }
  Logger.info({ ctx, msg: "post-ws.reloadWorkspace" });

  // Run any initialization code necessary for this workspace invocation.
  const initializer = WorkspaceInitFactory.create();

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
      DendronExtension.version()
    );
  } else {
    const newVersion = DendronExtension.version();
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
          DendronExtension.version()
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
    getDWorkspace().config.dev || {};
  // const ctx = "startServer";
  const maybePort =
    DendronExtension.configuration().get<number | undefined>(
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
      googleOauthClientId: GOOGLE_OAUTH_ID,
      googleOauthClientSecret: GOOGLE_OAUTH_SECRET,
    });
    return { port: out.port };
  }

  // start server is separate process
  const logPath = getDWorkspace().logUri.fsPath;
  const out = await ServerUtils.execServerNode({
    scriptPath: path.join(__dirname, "server.js"),
    logPath,
    nextServerUrl,
    nextStaticRoot,
    port,
    googleOauthClientId: GOOGLE_OAUTH_ID,
    googleOauthClientSecret: GOOGLE_OAUTH_SECRET,
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
  const { extensionPath, extensionUri, logUri } = context;
  const stateService = new StateService({
    globalState: context.globalState,
    workspaceState: context.workspaceState,
  });

  Logger.info({
    ctx,
    stage,
    isDebug,
    logLevel,
    logPath: logUri.fsPath,
    extensionPath,
    extensionUri: extensionUri.fsPath,
    workspaceFile: workspaceFile?.fsPath,
    workspaceFolders: workspaceFolders?.map((fd) => fd.uri.fsPath),
  });

  initializeSentry(getStage());

  try {
    // Setup the workspace trust callback to detect changes from the user's
    // workspace trust settings 
    
    // This version check is a temporary, one-release patch to try to unblock
    // users who are on old versions of VS Code.
    let userOnOldVSCodeVer = false;
    // TODO: After temporary release, remove the version check and bump up our vs code
    // compat version in package.json to ^1.58.0
    if (semver.gte(vscode.version, "1.57.0")) {
      vscode.workspace.onDidGrantWorkspaceTrust(() => {
        getExtension().getEngine().trustedWorkspace = vscode.workspace.isTrusted;
      });
    }
    else {
      userOnOldVSCodeVer = true;
    }


    //  needs to be initialized to setup commands
    const ws = DendronExtension.getOrCreate(context, {
      skipSetup: stage === "test",
    });

    const currentVersion = DendronExtension.version();
    const previousWorkspaceVersion = stateService.getWorkspaceVersion();
    const previousGlobalVersion = stateService.getGlobalVersion();
    const extensionInstallStatus = VSCodeUtils.getInstallStatusForExtension({
      previousGlobalVersion,
      currentVersion,
    });
    const assetUri = WSUtils.getAssetUri(context);

    Logger.info({
      ctx,
      msg: "initializeWorkspace",
      wsType: ws.type,
      currentVersion,
      previousWorkspaceVersion,
      previousGlobalVersion,
      extensionInstallStatus,
    });

    if (DendronExtension.isActive(context)) {
      if (ws.type === WorkspaceType.NATIVE) {
        const workspaceFolder = WorkspaceUtils.findWSRootInWorkspaceFolders(
          DendronExtension.workspaceFolders()!
        );
        if (!workspaceFolder) {
          Logger.error({ msg: "No dendron.yml found in any workspace folder" });
          return false;
        }
        ws.workspaceImpl = new DendronNativeWorkspace({
          wsRoot: workspaceFolder?.uri.fsPath,
          logUri: context.logUri,
          assetUri,
        });
      } else {
        ws.workspaceImpl = new DendronCodeWorkspace({
          wsRoot: path.dirname(DendronExtension.workspaceFile().fsPath),
          logUri: context.logUri,
          assetUri,
        });
      }
      const wsImpl = getDWorkspace();
      const start = process.hrtime();
      const dendronConfig = wsImpl.config;

      // --- Get Version State
      const workspaceInstallStatus = VSCodeUtils.getInstallStatusForWorkspace({
        previousWorkspaceVersion,
        currentVersion,
      });
      const wsRoot = wsImpl.wsRoot;
      const wsService = new WorkspaceService({ wsRoot });

      await wsService.runMigrationsIfNecessary({
        currentVersion,
        previousVersion: previousWorkspaceVersion,
        dendronConfig,
        workspaceInstallStatus,
        wsConfig: await DendronExtension.instanceV2().getWorkspaceSettings(),
      });
      // initialize client
      setupSegmentClient(wsImpl);

      // Re-use the id for error reporting too:
      Sentry.setUser({ id: SegmentClient.instance().anonymousId });

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
      wsService.writeMeta({ version: DendronExtension.version() });

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
        vaults: wsImpl.vaults,
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
                  AnalyticsUtils.track(VSCodeEvents.ServerCrashed, {
                    code: type,
                  });
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

    const backupPaths: string[] = [];
    let keybindingPath: string;

    if (extensionInstallStatus === InstallStatus.INITIAL_INSTALL) {
      const vimInstalled = VSCodeUtils.isExtensionInstalled("vscodevim.vim");
      if (vimInstalled) {
        AnalyticsUtils.track(ExtensionEvents.VimExtensionInstalled);
        const { keybindingConfigPath, newKeybindings: resolvedKeybindings } =
          KeybindingUtils.checkAndApplyVimKeybindingOverrideIfExists();
        keybindingPath = keybindingConfigPath;
        if (!_.isUndefined(resolvedKeybindings)) {
          const today = Time.now().toFormat("yyyy.MM.dd.HHmmssS");
          const maybeBackupPath = `${keybindingConfigPath}.${today}.vim.old`;
          if (!fs.existsSync(keybindingConfigPath)) {
            fs.ensureFileSync(keybindingConfigPath);
            fs.writeFileSync(keybindingConfigPath, "[]");
          } else {
            fs.copyFileSync(keybindingConfigPath, maybeBackupPath);
            backupPaths.push(maybeBackupPath);
          }
          writeJSONWithComments(keybindingConfigPath, resolvedKeybindings);
          AnalyticsUtils.track(ExtensionEvents.VimExtensionInstalled, {
            fixApplied: true,
          });
        }
      }
    }

    if (extensionInstallStatus === InstallStatus.UPGRADED) {
      const { keybindingConfigPath, migratedKeybindings } =
        KeybindingUtils.checkAndMigrateLookupKeybindingIfExists();
      keybindingPath = keybindingConfigPath;
      if (!_.isUndefined(migratedKeybindings)) {
        const today = Time.now().toFormat("yyyy.MM.dd.HHmmssS");
        const maybeBackupPath = `${keybindingConfigPath}.${today}.lookup.old`
        fs.copyFileSync(keybindingConfigPath, maybeBackupPath);
        backupPaths.push(maybeBackupPath);
        writeJSONWithComments(keybindingConfigPath, migratedKeybindings);
      }
    }

    if (backupPaths.length > 0) {
      vscode.window
        .showInformationMessage(
          "Conflicting or outdated keybindings have been updated. Click the button below to see changes.",
          ...["Open changes"]
        ).then(async (selection) => {
          if (selection) {
            const uri = vscode.Uri.file(keybindingPath);
            await VSCodeUtils.openFileInEditor(uri);
            backupPaths.forEach(async (backupPath) => {
              const backupUri = vscode.Uri.file(backupPath);
              await VSCodeUtils.openFileInEditor(backupUri, {
                column: vscode.ViewColumn.Beside,
              });
            });
          }
        });
    }


    if (userOnOldVSCodeVer) {
      AnalyticsUtils.track(VSCodeEvents.UserOnOldVSCodeVerUnblocked);
    }

    return showWelcomeOrWhatsNew({
      extensionInstallStatus,
      version: DendronExtension.version(),
      previousExtensionVersion: previousWorkspaceVersion,
      start: startActivate,
      assetUri,
    }).then(() => {
      if (DendronExtension.isActive(context)) {
        HistoryService.instance().add({
          source: "extension",
          action: "activate",
        });
      }
      return false;
    });
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}

function toggleViews(enabled: boolean) {
  const ctx = "toggleViews";
  Logger.info({ ctx, msg: `views enabled: ${enabled}` });
  VSCodeUtils.setContext(DendronContext.PLUGIN_ACTIVE, enabled);
}

// this method is called when your extension is deactivated
export function deactivate() {
  const ws = getDWorkspace();
  if (!WorkspaceUtils.isNativeWorkspace(ws)) {
    getExtension().deactivate();
  }
  toggleViews(false);
}

async function showWelcomeOrWhatsNew({
  extensionInstallStatus,
  version,
  previousExtensionVersion,
  start,
  assetUri,
}: {
  extensionInstallStatus: InstallStatus;
  version: string;
  previousExtensionVersion: string;
  start: [number, number];
  assetUri: vscode.Uri;
}) {
  const ctx = "showWelcomeOrWhatsNew";
  Logger.info({ ctx, version, previousExtensionVersion });
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
      await WSUtils.showWelcome(assetUri);
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

  // Show lapsed users (users who have installed Dendron but haven't initialied
  // a workspace) a reminder prompt to re-engage them.
  if (shouldDisplayLapsedUserMsg()) {
    showLapsedUserMessage(assetUri);
  }
}

function showLapsedUserMessage(assetUri: vscode.Uri) {
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
        WSUtils.showWelcome(assetUri);
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

  // If the user has never initialized, has never activated a dendron workspace,
  // and it's time to refresh the lapsed user message
  return (
    !metaData.dendronWorkspaceActivated &&
    !metaData.firstWsInitialize &&
    refreshMsg
  );
}

function initializeSentry(environment: string): void {
  // Setting an undefined dsn will stop uploads.
  const dsn =
    environment === "prod"
      ? "https://bc206b31a30a4595a2efb31e8cc0c04e@o949501.ingest.sentry.io/5898219"
      : undefined;

  // Respect user's telemetry settings for error reporting too.
  const enabled = !SegmentClient.instance().hasOptedOut;

  Sentry.init({
    dsn,
    defaultIntegrations: false,
    tracesSampleRate: 1.0,
    enabled,
    environment,
    attachStacktrace: true,
    beforeSend(event, hint) {
      const error = hint?.originalException;
      if (error && error instanceof DendronError) {
        event.extra = {
          name: error.name,
          message: error.message,
          payload: error.payload,
          severity: error.severity?.toString(),
          code: error.code,
          status: error.status,
          isComposite: error.isComposite,
        };
      }
      return event;
    },
    integrations: [
      new RewriteFrames({
        prefix: "app:///dist/",
      }),
    ],
  });
  return;
}
