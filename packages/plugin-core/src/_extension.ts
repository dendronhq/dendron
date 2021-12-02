import {
  launchv2,
  ServerUtils,
  SubProcessExitType,
} from "@dendronhq/api-server";
import {
  ConfigUtils,
  CONSTANTS,
  DendronError,
  ExtensionEvents,
  getStage,
  InstallStatus,
  MigrationEvents,
  NativeWorkspaceEvents,
  Time,
  VaultUtils,
  VSCodeEvents,
  WorkspaceType,
} from "@dendronhq/common-all";
import {
  getDurationMilliseconds,
  getOS,
  initializeSentry,
  SegmentClient,
  writeJSONWithComments,
} from "@dendronhq/common-server";
import {
  FileAddWatcher,
  HistoryService,
  MetadataService,
  MigrationChangeSetStatus,
  WorkspaceService,
  WorkspaceUtils,
} from "@dendronhq/engine-server";
import * as Sentry from "@sentry/node";
import { ExecaChildProcess } from "execa";
import fs from "fs-extra";
import _ from "lodash";
import { Duration } from "luxon";
import os from "os";
import path from "path";
import semver from "semver";
import * as vscode from "vscode";
import { ALL_COMMANDS } from "./commands";
import { GoToSiblingCommand } from "./commands/GoToSiblingCommand";
import { MoveNoteCommand } from "./commands/MoveNoteCommand";
import { ReloadIndexCommand } from "./commands/ReloadIndex";
import {
  CONFIG,
  DendronContext,
  DENDRON_COMMANDS,
  GLOBAL_STATE,
} from "./constants";
import { codeActionProvider } from "./features/codeActionProvider";
import { completionProvider } from "./features/completionProvider";
import DefinitionProvider from "./features/DefinitionProvider";
import FrontmatterFoldingRangeProvider from "./features/FrontmatterFoldingRangeProvider";
import ReferenceHoverProvider from "./features/ReferenceHoverProvider";
import ReferenceProvider from "./features/ReferenceProvider";
import { KeybindingUtils } from "./KeybindingUtils";
import { Logger } from "./logger";
import { EngineAPIService } from "./services/EngineAPIService";
import { StateService } from "./services/stateService";
import { Extensions } from "./settings";
import { SurveyUtils } from "./survey";
import { setupSegmentClient } from "./telemetry";
import { GOOGLE_OAUTH_ID, GOOGLE_OAUTH_SECRET } from "./types/global";
import { AnalyticsUtils, sentryReportingCallback } from "./utils/analytics";
import { MarkdownUtils } from "./utils/md";
import { DendronTreeView } from "./views/DendronTreeView";
import { VSCodeUtils } from "./vsCodeUtils";
import { showWelcome } from "./WelcomeUtils";
import {
  DendronExtension,
  getDWorkspace,
  getEngine,
  getExtension,
} from "./workspace";
import { DendronCodeWorkspace } from "./workspace/codeWorkspace";
import { DendronNativeWorkspace } from "./workspace/nativeWorkspace";
import { WorkspaceInitFactory } from "./workspace/workspaceInitializer";
import { WSUtils } from "./WSUtils";

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

/** Prompts the user to pick a wsRoot if there are more than one. */
async function getOrPromptWSRoot(workspaceFolders: string[]) {
  if (!workspaceFolders) {
    Logger.error({ msg: "No dendron.yml found in any workspace folder" });
    return undefined;
  }
  if (workspaceFolders.length === 1) {
    return workspaceFolders[0];
  } else {
    const selectedRoot = await VSCodeUtils.showQuickPick(
      workspaceFolders.map((folder): vscode.QuickPickItem => {
        return {
          label: folder,
        };
      }),
      {
        ignoreFocusOut: true,
        canPickMany: false,
        title: "Select Dendron workspace to load",
      }
    );
    if (!selectedRoot) {
      await vscode.window.showInformationMessage(
        "You skipped loading any Dendron workspace, Dendron is not active. You can run the 'Developer: Reload Window' command to reactivate Dendron."
      );
      Logger.info({
        msg: "User skipped loading a Dendron workspace",
        workspaceFolders,
      });
      return null;
    }
    return selectedRoot.label;
  }
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

// Only exported for test purposes
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

  // Respect user's telemetry settings for error reporting too.
  if (!SegmentClient.instance().hasOptedOut && getStage() === "prod") {
    initializeSentry(getStage());
  }

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
        getExtension().getEngine().trustedWorkspace =
          vscode.workspace.isTrusted;
      });
    } else {
      userOnOldVSCodeVer = true;
    }

    //  needs to be initialized to setup commands
    const ws = await DendronExtension.getOrCreate(context, {
      skipSetup: stage === "test",
    });
    // Need to recompute this for tests, because the instance of DendronExtension doesn't get re-created.
    // Probably also needed if the user switches from one workspace to the other.
    ws.type = await WorkspaceUtils.getWorkspaceType({
      workspaceFile: vscode.workspace.workspaceFile,
      workspaceFolders: vscode.workspace.workspaceFolders,
    });
    // Also need to reset the implementation here for testing. Doing it in all
    // cases because if the extension is activated, we'll recreate it while
    // activating the workspace
    ws.workspaceImpl = undefined;

    const currentVersion = DendronExtension.version();
    const previousWorkspaceVersion = stateService.getWorkspaceVersion();
    const previousGlobalVersion = stateService.getGlobalVersion();
    const extensionInstallStatus = VSCodeUtils.getInstallStatusForExtension({
      previousGlobalVersion,
      currentVersion,
    });
    const assetUri = VSCodeUtils.getAssetUri(context);

    Logger.info({
      ctx,
      msg: "initializeWorkspace",
      wsType: ws.type,
      currentVersion,
      previousWorkspaceVersion,
      previousGlobalVersion,
      extensionInstallStatus,
    });

    if (await DendronExtension.isDendronWorkspace()) {
      if (ws.type === WorkspaceType.NATIVE) {
        const workspaceFolders =
          await WorkspaceUtils.findWSRootsInWorkspaceFolders(
            DendronExtension.workspaceFolders()!
          );
        if (!workspaceFolders) {
          return false;
        }
        const wsRoot = await getOrPromptWSRoot(workspaceFolders);
        if (!wsRoot) return false;

        ws.workspaceImpl = new DendronNativeWorkspace({
          wsRoot,
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

      // initialize client
      setupSegmentClient(wsImpl);

      const changes = await wsService.runMigrationsIfNecessary({
        currentVersion,
        previousVersion: previousWorkspaceVersion,
        dendronConfig,
        workspaceInstallStatus,
        wsConfig: await DendronExtension.instanceV2().getWorkspaceSettings(),
      });

      if (changes.length > 0) {
        changes.forEach((change: MigrationChangeSetStatus) => {
          const event = _.isUndefined(change.error)
            ? MigrationEvents.MigrationSucceeded
            : MigrationEvents.MigrationFailed;

          AnalyticsUtils.track(event, {
            data: change.data,
          });
        });
      } else {
        // no migration changes.
        // see if we need to force a config migration.
        const configMigrationChanges =
          await wsService.runConfigMigrationIfNecessary({
            currentVersion,
            dendronConfig,
          });

        if (configMigrationChanges.length > 0) {
          configMigrationChanges.forEach((change: MigrationChangeSetStatus) => {
            const event = _.isUndefined(change.error)
              ? MigrationEvents.MigrationSucceeded
              : MigrationEvents.MigrationFailed;
            AnalyticsUtils.track(event, {
              data: change.data,
            });
          });
          vscode.window.showInformationMessage(
            "We have detected a legacy configuration in dendron.yml and migrated to the newest configurations. You can find a backup of the original file in your root directory."
          );
        }
      }
      // initialize client
      if (getStage() === "prod") {
        const segmentResidualCacheDir = context.globalStorageUri.fsPath;
        fs.ensureDir(segmentResidualCacheDir);
        setupSegmentClient(
          wsImpl,
          path.join(segmentResidualCacheDir, "segmentresidualcache.log")
        );

        // Try to flush the Segment residual cache every hour:
        (function tryFlushSegmentCache() {
          SegmentClient.instance()
            .tryFlushResidualCache()
            .then((result) => {
              Logger.info(
                `Segment Residual Cache flush attempted. ${JSON.stringify(
                  result
                )}`
              );
            });

          // Repeat once an hour:
          setTimeout(tryFlushSegmentCache, 3600000);
        })();
      }

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

      // check for vaults with same name
      const vaults = ConfigUtils.getVaults(dendronConfig);
      const uniqVaults = _.uniqBy(vaults, (vault) => VaultUtils.getName(vault));
      if (_.size(uniqVaults) < _.size(vaults)) {
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
        workspaceInstallStatus,
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
      updateEngineAPI(port);
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

      // used for enablement of legacy show preview command.
      VSCodeUtils.setContext(
        DendronContext.HAS_LEGACY_PREVIEW,
        MarkdownUtils.hasLegacyPreview()
      );

      // round to nearest 10th
      let numNotes = _.size(getEngine().notes);
      if (numNotes > 10) {
        numNotes = Math.round(numNotes / 10) * 10;
      }

      MetadataService.instance().setDendronWorkspaceActivated();

      const codeWorkspacePresent = await fs.pathExists(
        path.join(wsRoot, CONSTANTS.DENDRON_WS_NAME)
      );
      AnalyticsUtils.identify();
      AnalyticsUtils.track(VSCodeEvents.InitializeWorkspace, {
        duration: durationReloadWorkspace,
        noCaching: dendronConfig.noCaching || false,
        numNotes,
        numVaults: _.size(getEngine().vaults),
        workspaceType: ws.type,
        codeWorkspacePresent,
      });
      if (stage !== "test") {
        await ws.activateWatchers();
        toggleViews(true);
      }
      Logger.info({ ctx, msg: "fin startClient", durationReloadWorkspace });
    } else {
      // ws not active
      Logger.info({ ctx, msg: "dendron not active" });

      const watchForNativeWorkspace = vscode.workspace
        .getConfiguration()
        .get<boolean>(CONFIG.WATCH_FOR_NATIVE_WS.key);
      if (watchForNativeWorkspace) {
        Logger.info({
          ctx,
          msg: "watching for a native workspace to be created",
        });

        toggleViews(false);
        const autoInit = new FileAddWatcher(
          vscode.workspace.workspaceFolders?.map(
            (vscodeFolder) => vscodeFolder.uri.fsPath
          ) || [],
          CONSTANTS.DENDRON_CONFIG_FILE,
          async (filePath) => {
            Logger.info({
              ctx,
              msg: "New `dendron.yml` file has been created, re-activating dendron",
            });
            AnalyticsUtils.track(NativeWorkspaceEvents.DetectedInNonDendronWS, {
              filePath,
            });
            await ws.deactivate();
            activate(context);
          }
        );
        ws.addDisposable(autoInit);
      }
    }

    // Setup the commands
    _setupCommands(context);
    _setupLanguageFeatures(context);

    const backupPaths: string[] = [];
    let keybindingPath: string;

    if (extensionInstallStatus === InstallStatus.INITIAL_INSTALL) {
      const vimInstalled = VSCodeUtils.isExtensionInstalled("vscodevim.vim");
      // only need to run this for non-mac
      if (vimInstalled && os.type() !== "Darwin") {
        Logger.info({
          ctx,
          msg: "checkAndApplyVimKeybindingOverrideIfExists:pre",
        });
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
        const maybeBackupPath = `${keybindingConfigPath}.${today}.lookup.old`;
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
        )
        .then(async (selection) => {
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

    await showWelcomeOrWhatsNew({
      extensionInstallStatus,
      version: DendronExtension.version(),
      previousExtensionVersion: previousWorkspaceVersion,
      start: startActivate,
      assetUri,
    });
    if (DendronExtension.isActive(context)) {
      HistoryService.instance().add({
        source: "extension",
        action: "activate",
      });
      return true;
    }
    return false;
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}

function toggleViews(enabled: boolean) {
  const ctx = "toggleViews";
  Logger.info({ ctx, msg: `views enabled: ${enabled}` });
  VSCodeUtils.setContext(DendronContext.PLUGIN_ACTIVE, enabled);
  VSCodeUtils.setContext(DendronContext.HAS_CUSTOM_MARKDOWN_VIEW, enabled);
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
      showWelcome(assetUri);
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
    await showLapsedUserMessage(assetUri);
  }

  // Show inactive users (users who were active on first week but have not used lookup in a month)
  // a reminder prompt to re-engage them.
  if (await shouldDisplayInactiveUserSurvey()) {
    await showInactiveUserMessage();
  }
}

export async function showInactiveUserMessage() {
  AnalyticsUtils.track(VSCodeEvents.ShowInactiveUserMessage);
  MetadataService.instance().setInactiveUserMsgSendTime();
  await SurveyUtils.showInactiveUserSurvey();
}

export async function showLapsedUserMessage(assetUri: vscode.Uri) {
  const START_TITLE = "Get Started";

  AnalyticsUtils.track(VSCodeEvents.ShowLapsedUserMessage);
  MetadataService.instance().setLapsedUserMsgSendTime();
  vscode.window
    .showInformationMessage(
      "Hey, we noticed you haven't started using Dendron yet. Would you like to get started?",
      { modal: true },
      { title: START_TITLE }
    )
    .then(async (resp) => {
      if (resp?.title === START_TITLE) {
        AnalyticsUtils.track(VSCodeEvents.LapsedUserMessageAccepted);
        showWelcome(assetUri);
      } else {
        AnalyticsUtils.track(VSCodeEvents.LapsedUserMessageRejected);
        const lapsedSurveySubmitted =
          await StateService.instance().getGlobalState(
            GLOBAL_STATE.LAPSED_USER_SURVEY_SUBMITTED
          );
        if (lapsedSurveySubmitted === undefined) {
          await SurveyUtils.showLapsedUserSurvey();
        }
        return;
      }
    });
}

export async function shouldDisplayInactiveUserSurvey(): Promise<boolean> {
  const inactiveSurveySubmitted = await StateService.instance().getGlobalState(
    GLOBAL_STATE.INACTIVE_USER_SURVEY_SUBMITTED
  );

  const ONE_WEEK = Duration.fromObject({ weeks: 1 });
  const FOUR_WEEKS = Duration.fromObject({ weeks: 4 });
  const CUR_TIME = Duration.fromObject({ seconds: Time.now().toSeconds() });
  const metaData = MetadataService.instance().getMeta();

  const FIRST_INSTALL =
    metaData.firstInstall !== undefined
      ? Duration.fromObject({ seconds: metaData.firstInstall })
      : undefined;

  const FIRST_LOOKUP_TIME =
    metaData.firstLookupTime !== undefined
      ? Duration.fromObject({ seconds: metaData.firstLookupTime })
      : undefined;

  const LAST_LOOKUP_TIME =
    metaData.lastLookupTime !== undefined
      ? Duration.fromObject({ seconds: metaData.lastLookupTime })
      : undefined;

  const INACTIVE_USER_MSG_SEND_TIME =
    metaData.inactiveUserMsgSendTime !== undefined
      ? Duration.fromObject({ seconds: metaData.inactiveUserMsgSendTime })
      : undefined;

  // is the user a first week active user?
  const isFirstWeekActive =
    FIRST_INSTALL !== undefined &&
    FIRST_LOOKUP_TIME !== undefined &&
    FIRST_LOOKUP_TIME.minus(FIRST_INSTALL) <= ONE_WEEK;

  // was the user active on the first week but has been inactive for a month?
  const isInactive =
    isFirstWeekActive &&
    LAST_LOOKUP_TIME !== undefined &&
    CUR_TIME.minus(LAST_LOOKUP_TIME) >= FOUR_WEEKS;

  if (!_.isUndefined(inactiveSurveySubmitted)) {
    const shouldSendAgain =
      INACTIVE_USER_MSG_SEND_TIME !== undefined &&
      CUR_TIME.minus(INACTIVE_USER_MSG_SEND_TIME) >= FOUR_WEEKS;
    return shouldSendAgain;
  }

  return (
    // If the user has been active on first week, but been inactive for more than 4 weeks.
    metaData.dendronWorkspaceActivated !== undefined &&
    metaData.firstWsInitialize !== undefined &&
    isInactive
  );
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

export function _setupCommands(context: vscode.ExtensionContext) {
  ALL_COMMANDS.map((Cmd) => {
    const cmd = new Cmd();
    context.subscriptions.push(
      vscode.commands.registerCommand(
        cmd.key,
        sentryReportingCallback(async (args: any) => {
          await cmd.run(args);
        })
      )
    );
  });

  context.subscriptions.push(
    vscode.commands.registerCommand(
      DENDRON_COMMANDS.RELOAD_INDEX.key,
      sentryReportingCallback(async (silent?: boolean) => {
        const out = await new ReloadIndexCommand().run({ silent });
        if (!silent) {
          vscode.window.showInformationMessage(`finish reload`);
        }
        return out;
      })
    )
  );

  // ---

  context.subscriptions.push(
    vscode.commands.registerCommand(
      DENDRON_COMMANDS.GO_NEXT_HIERARCHY.key,
      sentryReportingCallback(async () => {
        await new GoToSiblingCommand().execute({ direction: "next" });
      })
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      DENDRON_COMMANDS.GO_PREV_HIERARCHY.key,
      sentryReportingCallback(async () => {
        await new GoToSiblingCommand().execute({ direction: "prev" });
      })
    )
  );

  // RENAME is alias to MOVE
  context.subscriptions.push(
    vscode.commands.registerCommand(
      DENDRON_COMMANDS.RENAME_NOTE.key,
      sentryReportingCallback(async (args: any) => {
        await new MoveNoteCommand().run({
          allowMultiselect: false,
          useSameVault: true,
          ...args,
        });
      })
    )
  );
}

export function _setupLanguageFeatures(context: vscode.ExtensionContext) {
  const mdLangSelector = { language: "markdown", scheme: "*" };
  vscode.languages.registerReferenceProvider(
    mdLangSelector,
    new ReferenceProvider()
  );
  vscode.languages.registerDefinitionProvider(
    mdLangSelector,
    new DefinitionProvider()
  );
  vscode.languages.registerHoverProvider(
    mdLangSelector,
    new ReferenceHoverProvider()
  );
  vscode.languages.registerFoldingRangeProvider(
    mdLangSelector,
    new FrontmatterFoldingRangeProvider()
  );
  completionProvider.activate(context);
  codeActionProvider.activate(context);
}

function updateEngineAPI(port: number | string): void {
  const ext = getExtension();
  const svc = EngineAPIService.createEngine({
    port,
    enableWorkspaceTrust: vscode.workspace.isTrusted,
  });
  ext.setEngine(svc);
  ext.port = _.toInteger(port);
  // const engine = ext.getEngine();
  // return engine;
}
