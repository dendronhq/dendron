import {
  launchv2,
  ServerUtils,
  SubProcessExitType,
} from "@dendronhq/api-server";
import {
  assertUnreachable,
  ConfigEvents,
  ConfigUtils,
  CONSTANTS,
  CURRENT_AB_TESTS,
  DendronError,
  DENDRON_VSCODE_CONFIG_KEYS,
  getStage,
  GitEvents,
  GraphEvents,
  GraphThemeEnum,
  GraphThemeTestGroups,
  GRAPH_THEME_TEST,
  InstallStatus,
  IntermediateDendronConfig,
  isDisposable,
  SelfContainedVaultsTestGroups,
  SELF_CONTAINED_VAULTS_TEST,
  Time,
  TutorialEvents,
  UpgradeToastWordingTestGroups,
  UPGRADE_TOAST_WORDING_TEST,
  VaultUtils,
  VSCodeEvents,
  WorkspaceType,
} from "@dendronhq/common-all";
import {
  getDurationMilliseconds,
  getOS,
  initializeSentry,
  SegmentClient,
} from "@dendronhq/common-server";
import {
  DConfig,
  HistoryService,
  MetadataService,
  WorkspaceService,
  WorkspaceUtils,
} from "@dendronhq/engine-server";
import * as Sentry from "@sentry/node";
import { ExecaChildProcess } from "execa";
import fs from "fs-extra";
import _ from "lodash";
import os from "os";
import path from "path";
import semver from "semver";
import * as vscode from "vscode";
import { ALL_COMMANDS } from "./commands";
import { GoToSiblingCommand } from "./commands/GoToSiblingCommand";
import { MoveNoteCommand } from "./commands/MoveNoteCommand";
import { ReloadIndexCommand } from "./commands/ReloadIndex";
import { SeedAddCommand } from "./commands/SeedAddCommand";
import {
  SeedBrowseCommand,
  WebViewPanelFactory,
} from "./commands/SeedBrowseCommand";
import { SeedRemoveCommand } from "./commands/SeedRemoveCommand";
import { ShowNoteGraphCommand } from "./commands/ShowNoteGraph";
import { ShowPreviewCommand } from "./commands/ShowPreview";
import { ShowSchemaGraphCommand } from "./commands/ShowSchemaGraph";
import { NoteGraphPanelFactory } from "./components/views/NoteGraphViewFactory";
import { PreviewPanelFactory } from "./components/views/PreviewViewFactory";
import { SchemaGraphViewFactory } from "./components/views/SchemaGraphViewFactory";
import { CONFIG, DendronContext, DENDRON_COMMANDS } from "./constants";
import { codeActionProvider } from "./features/codeActionProvider";
import { completionProvider } from "./features/completionProvider";
import DefinitionProvider from "./features/DefinitionProvider";
import FrontmatterFoldingRangeProvider from "./features/FrontmatterFoldingRangeProvider";
import ReferenceHoverProvider from "./features/ReferenceHoverProvider";
import ReferenceProvider from "./features/ReferenceProvider";
import RenameProvider from "./features/RenameProvider";
import { FeatureShowcaseToaster } from "./showcase/FeatureShowcaseToaster";
import { KeybindingUtils } from "./KeybindingUtils";
import { Logger } from "./logger";
import { EngineAPIService } from "./services/EngineAPIService";
import { StateService } from "./services/stateService";
import { TextDocumentServiceFactory } from "./services/TextDocumentServiceFactory";
import { Extensions } from "./settings";
import { IBaseCommand } from "./types";
import { GOOGLE_OAUTH_ID, GOOGLE_OAUTH_SECRET } from "./types/global";
import { AnalyticsUtils, sentryReportingCallback } from "./utils/analytics";
import { isAutoCompletable } from "./utils/AutoCompletable";
import { MarkdownUtils } from "./utils/md";
import { AutoCompletableRegistrar } from "./utils/registers/AutoCompletableRegistrar";
import { StartupUtils } from "./utils/StartupUtils";
import { EngineNoteProvider } from "./views/EngineNoteProvider";
import { NativeTreeView } from "./views/NativeTreeView";
import { VSCodeUtils } from "./vsCodeUtils";
import { showWelcome } from "./WelcomeUtils";
import { DendronExtension, getDWorkspace, getExtension } from "./workspace";
import { WorkspaceActivator } from "./workspace/workspaceActivater";
import { WorkspaceInitFactory } from "./workspace/WorkspaceInitFactory";
import { WSUtils } from "./WSUtils";

const MARKDOWN_WORD_PATTERN = new RegExp("([\\w\\.\\#]+)");
// === Main

class ExtensionUtils {
  static addCommand = ({
    context,
    key,
    cmd,
    existingCommands,
  }: {
    context: vscode.ExtensionContext;
    key: string;
    cmd: IBaseCommand;
    existingCommands: string[];
  }) => {
    if (!existingCommands.includes(key)) {
      context.subscriptions.push(
        vscode.commands.registerCommand(
          key,
          sentryReportingCallback(async (args) => {
            cmd.run(args);
          })
        )
      );
    }
  };

  static setWorkspaceContextOnActivate(
    dendronConfig: IntermediateDendronConfig
  ) {
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

    //used for enablement of export pod v2 command
    VSCodeUtils.setContext(
      DendronContext.ENABLE_EXPORT_PODV2,
      dendronConfig.dev?.enableExportPodV2 ?? false
    );

    // @deprecate: should track as property of workspace init instead
    if (dendronConfig.dev?.enableExportPodV2) {
      AnalyticsUtils.track(ConfigEvents.EnabledExportPodV2);
    }
  }

  /**
   * Setup segment client
   * Also setup cache flushing in case of missed uploads
   */

  static async startServerProcess({
    context,
    start,
    wsService,
  }: {
    context: vscode.ExtensionContext;
    wsService: WorkspaceService;
    start: [number, number];
  }) {
    const ctx = "startServerProcess";
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
    wsService.writePort(port);
    return port;
  }

  static getAndTrackInstallStatus({
    UUIDPathExists,
    previousGlobalVersion,
    currentVersion,
  }: {
    UUIDPathExists: boolean;
    currentVersion: string;
    previousGlobalVersion: string;
  }) {
    const extensionInstallStatus = VSCodeUtils.getInstallStatusForExtension({
      previousGlobalVersion,
      currentVersion,
    });

    // check if this is an install event, but a repeated one on a new instance.
    let isSecondaryInstall = false;

    // set initial install ^194e5bw7so9g
    if (extensionInstallStatus === InstallStatus.INITIAL_INSTALL) {
      // even if it's an initial install for this instance of vscode, it may not be for this machine.
      // in that case, we should skip setting the initial install time since it's already set.
      // we also check if we already set uuid for this machine. If so, this is not a true initial install.
      const metadata = MetadataService.instance().getMeta();
      if (metadata.firstInstall === undefined && !UUIDPathExists) {
        MetadataService.instance().setInitialInstall();
      } else {
        // we still want to proceed with InstallStatus.INITIAL_INSTALL because we want everything
        // tied to initial install to happen in this instance of VSCode once for the first time
        isSecondaryInstall = true;
      }
    }

    // TODO: temporary backfill
    if (_.isUndefined(MetadataService.instance().getMeta().firstInstall)) {
      const time = Time.DateTime.fromISO("2021-06-22");
      MetadataService.instance().setInitialInstall(time.toSeconds());
    }
    return { extensionInstallStatus, isSecondaryInstall };
  }

  /**
   * Analytics related to initializing the workspace
   * @param param0
   */
  static async trackWorkspaceInit({
    durationReloadWorkspace,
    ext,
    activatedSuccess,
  }: {
    durationReloadWorkspace: number;
    ext: DendronExtension;
    activatedSuccess: boolean;
  }) {
    const engine = ext.getEngine();
    const workspace = ext.getDWorkspace();
    const {
      wsRoot,
      vaults,
      type: workspaceType,
      config: dendronConfig,
    } = workspace;
    const numNotes = _.size(engine.notes);

    let numNoteRefs = 0;
    let numWikilinks = 0;
    let numBacklinks = 0;
    let numLinkCandidates = 0;
    let numFrontmatterTags = 0;

    // Takes about ~10 ms to compute in org-workspace
    Object.values(engine.notes).forEach((val) => {
      val.links.forEach((link) => {
        switch (link.type) {
          case "ref":
            numNoteRefs += 1;
            break;
          case "wiki":
            numWikilinks += 1;
            break;
          case "backlink":
            numBacklinks += 1;
            break;
          case "linkCandidate":
            numLinkCandidates += 1;
            break;
          case "frontmatterTag":
            numFrontmatterTags += 1;
            break;
          default:
            break;
        }
      });
    });

    const numSchemas = _.size(engine.schemas);
    const codeWorkspacePresent = await fs.pathExists(
      path.join(wsRoot, CONSTANTS.DENDRON_WS_NAME)
    );
    const publishigConfig = ConfigUtils.getPublishingConfig(dendronConfig);
    const siteUrl = publishigConfig.siteUrl;
    const publishingTheme = dendronConfig?.publishing?.theme;
    const enabledExportPodV2 = dendronConfig.dev?.enableExportPodV2;
    const { workspaceFile, workspaceFolders } = vscode.workspace;
    const trackProps = {
      duration: durationReloadWorkspace,
      noCaching: dendronConfig.noCaching || false,
      numNotes,
      numNoteRefs,
      numWikilinks,
      numBacklinks,
      numLinkCandidates,
      numFrontmatterTags,
      numSchemas,
      numVaults: vaults.length,
      workspaceType,
      codeWorkspacePresent,
      selfContainedVaultsEnabled:
        dendronConfig.dev?.enableSelfContainedVaults || false,
      numSelfContainedVaults: vaults.filter(VaultUtils.isSelfContained).length,
      numRemoteVaults: vaults.filter(VaultUtils.isRemote).length,
      numWorkspaceVaults: vaults.filter(
        (vault) => vault.workspace !== undefined
      ).length,
      numSeedVaults: vaults.filter((vault) => vault.seed !== undefined).length,
      activationSucceeded: activatedSuccess,
      hasLegacyPreview: MarkdownUtils.hasLegacyPreview(),
      enabledExportPodV2,
      hasWorkspaceFile: !_.isUndefined(workspaceFile),
      workspaceFolders: _.isUndefined(workspaceFolders)
        ? 0
        : workspaceFolders.length,
      hasLocalConfig: false,
      numLocalConfigVaults: 0,
    };
    if (siteUrl !== undefined) {
      _.set(trackProps, "siteUrl", siteUrl);
    }
    if (publishingTheme !== undefined) {
      _.set(trackProps, "publishingTheme", publishingTheme);
    }
    const maybeLocalConfig = DConfig.searchLocalConfigSync(wsRoot);
    if (maybeLocalConfig.data) {
      trackProps.hasLocalConfig = true;
      if (maybeLocalConfig.data.workspace.vaults) {
        trackProps.numLocalConfigVaults =
          maybeLocalConfig.data.workspace.vaults.length;
      }
    }

    AnalyticsUtils.identify({
      numNotes,
      // Which side of all currently running tests is this user on?
      splitTests: CURRENT_AB_TESTS.map(
        (test) =>
          // Formatted as `testName.groupName` since group names are not necessarily unique
          `${test.name}.${test.getUserGroup(
            SegmentClient.instance().anonymousId
          )}`
      ),
    });
    AnalyticsUtils.track(VSCodeEvents.InitializeWorkspace, trackProps);
  }

  /**
   * Track if welcome button was clicked
   */
  static trackWelcomeClicked() {
    const welcomeClickedTime = MetadataService.instance().getWelcomeClicked();
    // check if we have a welcome click message
    // see [[../packages/plugin-core/src/WelcomeUtils.ts#^z5hpzc3fdkxs]] where this property is set
    if (welcomeClickedTime) {
      AnalyticsUtils.track(
        TutorialEvents.ClickStart,
        {},
        {
          timestamp: welcomeClickedTime,
        }
      ).then(() => {
        MetadataService.instance().deleteMeta("welcomeClickedTime");
      });
    }
  }
}

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  const stage = getStage();
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

async function reloadWorkspace(opts: { extension: DendronExtension }) {
  const ctx = "reloadWorkspace";
  const { extension } = opts;
  const ws = extension.getDWorkspace();
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

  await postReloadWorkspace({ extension });
  HistoryService.instance().add({
    source: "extension",
    action: "initialized",
  });
  return maybeEngine;
}

async function postReloadWorkspace(opts: { extension: DendronExtension }) {
  const ctx = "postReloadWorkspace";
  const { extension } = opts;
  const wsService = extension.workspaceService;
  if (!wsService) {
    const errorMsg = "No workspace service found.";
    Logger.error({
      msg: errorMsg,
      error: new DendronError({ message: errorMsg }),
    });
    return;
  }

  const wsMeta = wsService.getMeta();
  const previousWsVersion = wsMeta.version;
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
    wsService.writeMeta({ version: DendronExtension.version() });
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
        wsService.writeMeta({ version: DendronExtension.version() });
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

  // start server is separate process ^pyiildtq4tdx
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

// Only exported for test purposes ^jtm6bf7utsxy
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

  // At this point, the segment client has not been created yet.
  // We need to check here if the uuid has been set for future references
  // because the Segment client constructor will go ahead and create one if it doesn't exist.
  const maybeUUIDPath = path.join(os.homedir(), CONSTANTS.DENDRON_ID);
  const UUIDPathExists = await fs.pathExists(maybeUUIDPath);

  // If telemetry is not disabled, we enable telemetry and error reporting ^rw8l1w51hnjz
  // - NOTE: we do this outside of the try/catch block in case we run into an error with initialization
  if (!SegmentClient.instance().hasOptedOut && getStage() === "prod") {
    initializeSentry({
      environment: getStage(),
      sessionId: AnalyticsUtils.getSessionId(),
      release: AnalyticsUtils.getVSCodeSentryRelease(),
    });
  }

  try {
    // Setup the workspace trust callback to detect changes from the user's
    // workspace trust settings

    // This version check is a temporary, one-release patch to try to unblock
    // users who are on old versions of VS Code.
    vscode.workspace.onDidGrantWorkspaceTrust(() => {
      getExtension().getEngine().trustedWorkspace = vscode.workspace.isTrusted;
    });

    //  needs to be initialized to setup commands
    const ws = await DendronExtension.getOrCreate(context, {
      skipSetup: stage === "test",
    });

    // Setup the commands
    await _setupCommands({ ws, context, requireActiveWorkspace: false });
    _setupLanguageFeatures(context);

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
    const previousWorkspaceVersionFromState =
      stateService.getWorkspaceVersion();

    const previousGlobalVersionFromState = stateService.getGlobalVersion();
    let previousGlobalVersionFromMetadata =
      MetadataService.instance().getGlobalVersion();
    // state is more recent than global, backfill
    if (
      semver.gt(
        previousGlobalVersionFromState,
        previousGlobalVersionFromMetadata
      )
    ) {
      previousGlobalVersionFromMetadata = previousGlobalVersionFromState;
    }
    const previousGlobalVersion = previousGlobalVersionFromMetadata;

    const { extensionInstallStatus, isSecondaryInstall } =
      ExtensionUtils.getAndTrackInstallStatus({
        UUIDPathExists,
        currentVersion,
        previousGlobalVersion,
      });

    if (
      !isSecondaryInstall &&
      extensionInstallStatus === InstallStatus.INITIAL_INSTALL
    ) {
      // For new users, we want to roll out self contained vaults to some of
      // them. We'll do that by setting the global config, so all workspace
      // they create from now on will be self contained, and they can turn off
      // the config if there are problems.
      const split = SELF_CONTAINED_VAULTS_TEST.getUserGroup(
        SegmentClient.instance().anonymousId
      );
      if (split === SelfContainedVaultsTestGroups.selfContained) {
        VSCodeUtils.setWorkspaceConfig(
          DENDRON_VSCODE_CONFIG_KEYS.ENABLE_SELF_CONTAINED_VAULTS_WORKSPACE,
          true,
          vscode.ConfigurationTarget.Global
        );
      }

      // For new users, we want to load graph with new graph themes as default
      let graphTheme;
      const ABUserGroup = GRAPH_THEME_TEST.getUserGroup(
        SegmentClient.instance().anonymousId
      );
      switch (ABUserGroup) {
        case GraphThemeTestGroups.monokai: {
          graphTheme = GraphThemeEnum.Monokai;
          break;
        }
        case GraphThemeTestGroups.block: {
          graphTheme = GraphThemeEnum.Block;
          break;
        }
        default:
          graphTheme = GraphThemeEnum.Classic;
      }
      AnalyticsUtils.track(GraphEvents.GraphThemeChanged, {
        setDuringInstall: true,
      });
      MetadataService.instance().setGraphTheme(graphTheme);
    }
    const assetUri = VSCodeUtils.getAssetUri(context);

    Logger.info({
      ctx,
      msg: "initializeWorkspace",
      wsType: ws.type,
      currentVersion,
      previousGlobalVersion,
      extensionInstallStatus,
    });

    if (await DendronExtension.isDendronWorkspace()) {
      const activator = new WorkspaceActivator();
      const maybeWs = await activator.activate({ ext: ws, context });
      if (!maybeWs) {
        return false;
      }
      const wsImpl = maybeWs;
      const start = process.hrtime();
      const dendronConfig = wsImpl.config;

      // --- Get Version State
      const wsRoot = wsImpl.wsRoot;
      const wsService = new WorkspaceService({ wsRoot });
      let previousWorkspaceVersionFromWSService = wsService.getMeta().version;
      if (
        semver.gt(
          previousWorkspaceVersionFromState,
          previousWorkspaceVersionFromWSService
        )
      ) {
        previousWorkspaceVersionFromWSService =
          previousWorkspaceVersionFromState;
        wsService.writeMeta({ version: previousGlobalVersionFromState });
      }
      const previousWorkspaceVersion = previousWorkspaceVersionFromWSService;

      // initialize Segment client
      AnalyticsUtils.setupSegmentWithCacheFlush({ context, ws: wsImpl });

      ExtensionUtils.trackWelcomeClicked();
      const maybeWsSettings =
        ws.type === WorkspaceType.CODE
          ? wsService.getCodeWorkspaceSettingsSync()
          : undefined;
      await StartupUtils.runMigrationsIfNecessary({
        wsService,
        currentVersion,
        previousWorkspaceVersion,
        maybeWsSettings,
        dendronConfig,
      });

      // check for missing default config keys and prompt for a backfill.
      StartupUtils.showMissingDefaultConfigMessageIfNecessary({
        ext: ws,
        extensionInstallStatus,
      });

      // check for deprecated config keys and prompt for removal.
      StartupUtils.showDeprecatedConfigMessageIfNecessary({
        ext: ws,
        extensionInstallStatus,
      });

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
      // set vaults now that ws is initialized
      const vaults = wsService.vaults;

      // check for vaults with same name
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
      const extensions = Extensions.getDendronExtensionRecommendations().map(
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
        platform,
        extensions,
        vaults: wsImpl.vaults,
      });

      // --- Start Initializating the Engine
      WSUtils.showInitProgress();

      const port = await ExtensionUtils.startServerProcess({
        context,
        start,
        wsService,
      });

      // Setup the Engine API Service and the tree view
      const engineAPIService = updateEngineAPI(port, ws);

      // TODO: This should eventually be consolidated with other view setup
      // logic as in workspace.ts, but right now this needs an instance of
      // EngineAPIService for init

      const providerConstructor = function () {
        return new EngineNoteProvider(engineAPIService);
      };

      const treeView = new NativeTreeView(providerConstructor);
      treeView.show();
      context.subscriptions.push(treeView);

      // Instantiate TextDocumentService
      context.subscriptions.push(TextDocumentServiceFactory.create(ws));

      // Order matters. Need to register `Reload Index` command before `reloadWorkspace`
      const existingCommands = await vscode.commands.getCommands();
      if (!existingCommands.includes(DENDRON_COMMANDS.RELOAD_INDEX.key)) {
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
      }
      const reloadSuccess = await reloadWorkspace({ extension: ws });
      const durationReloadWorkspace = getDurationMilliseconds(start);

      await ExtensionUtils.trackWorkspaceInit({
        durationReloadWorkspace,
        activatedSuccess: !!reloadSuccess,
        ext: ws,
      });

      if (!reloadSuccess) {
        HistoryService.instance().add({
          source: "extension",
          action: "not_initialized",
        });
        return false;
      }

      ExtensionUtils.setWorkspaceContextOnActivate(wsService.config);

      MetadataService.instance().setDendronWorkspaceActivated();
      await _setupCommands({ ws, context, requireActiveWorkspace: true });

      // Track contributors to repositories, but do so in the background so
      // initialization isn't delayed.
      const startGetAllReposNumContributors = process.hrtime();
      wsService
        .getAllReposNumContributors()
        .then((numContributors) => {
          AnalyticsUtils.track(GitEvents.ContributorsFound, {
            maxNumContributors: _.max(numContributors),
            duration: getDurationMilliseconds(startGetAllReposNumContributors),
          });
        })
        .catch((err) => {
          Sentry.captureException(err);
        });

      // on first install, warn if extensions are incompatible ^dlx35gstwsun
      if (extensionInstallStatus === InstallStatus.INITIAL_INSTALL) {
        StartupUtils.warnIncompatibleExtensions({ ext: ws });
      }

      if (stage !== "test") {
        await ws.activateWatchers();
        togglePluginActiveContext(true);
      }

      // Show the feature showcase toast one minute after initialization.
      const ONE_MINUTE_IN_MS = 60_000;
      setTimeout(() => {
        const showcase = new FeatureShowcaseToaster();
        showcase.showToast();
      }, ONE_MINUTE_IN_MS);

      Logger.info({ ctx, msg: "fin startClient", durationReloadWorkspace });
    } else {
      // ws not active
      Logger.info({ ctx, msg: "dendron not active" });
    }

    if (extensionInstallStatus === InstallStatus.INITIAL_INSTALL) {
      // if keybinding conflict is detected, let the users know and guide them how to resolve  ^rikhd9cc0rwb
      await KeybindingUtils.maybePromptKeybindingConflict();
    }

    await showWelcomeOrWhatsNew({
      extensionInstallStatus,
      isSecondaryInstall,
      version: DendronExtension.version(),
      previousExtensionVersion: previousWorkspaceVersionFromState,
      start: startActivate,
      assetUri,
    });

    if (DendronExtension.isActive(context)) {
      HistoryService.instance().add({
        source: "extension",
        action: "activate",
      });
      // If automaticallyShowPreview = true, display preview panel on start up
      const note = WSUtils.getActiveNote();
      if (
        note &&
        ws.workspaceService?.config.preview?.automaticallyShowPreview
      ) {
        await PreviewPanelFactory.create(getExtension()).show(note);
      }

      return true;
    }
    return false;
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}

function togglePluginActiveContext(enabled: boolean) {
  const ctx = "togglePluginActiveContext";
  Logger.info({ ctx, state: `togglePluginActiveContext: ${enabled}` });
  VSCodeUtils.setContext(DendronContext.PLUGIN_ACTIVE, enabled);
  VSCodeUtils.setContext(DendronContext.HAS_CUSTOM_MARKDOWN_VIEW, enabled);
}

// this method is called when your extension is deactivated
export function deactivate() {
  const ws = getDWorkspace();
  if (!WorkspaceUtils.isNativeWorkspace(ws)) {
    getExtension().deactivate();
  }
  togglePluginActiveContext(false);
}

async function showWelcomeOrWhatsNew({
  extensionInstallStatus,
  isSecondaryInstall,
  version,
  previousExtensionVersion,
  start,
  assetUri,
}: {
  extensionInstallStatus: InstallStatus;
  isSecondaryInstall: boolean;
  version: string;
  previousExtensionVersion: string;
  start: [number, number];
  assetUri: vscode.Uri;
}) {
  const ctx = "showWelcomeOrWhatsNew";
  Logger.info({ ctx, version, previousExtensionVersion });
  const metadataService = MetadataService.instance();
  switch (extensionInstallStatus) {
    case InstallStatus.INITIAL_INSTALL: {
      Logger.info({
        ctx,
        msg: `extension, ${
          isSecondaryInstall
            ? "initial install"
            : "secondary install on new vscode instance"
        }`,
      });
      // track how long install process took ^e8itkyfj2rn3
      AnalyticsUtils.track(VSCodeEvents.Install, {
        duration: getDurationMilliseconds(start),
        isSecondaryInstall,
      });

      metadataService.setGlobalVersion(version);

      // if user hasn't opted out of telemetry, notify them about it ^njhii5plxmxr
      if (!SegmentClient.instance().hasOptedOut) {
        AnalyticsUtils.showTelemetryNotice();
      }
      // show the welcome page ^ygtm7ofzezwd
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

      metadataService.setGlobalVersion(version);

      // ^t6dxodie048o
      const toastWording = UPGRADE_TOAST_WORDING_TEST.getUserGroup(
        SegmentClient.instance().anonymousId
      );

      AnalyticsUtils.track(VSCodeEvents.Upgrade, {
        previousVersion: previousExtensionVersion,
        duration: getDurationMilliseconds(start),
        toastWording,
      });

      let buttonAction: string;
      switch (toastWording) {
        case UpgradeToastWordingTestGroups.openChangelog:
          buttonAction = "Open the changelog";
          break;
        case UpgradeToastWordingTestGroups.seeWhatChanged:
          buttonAction = "See what changed";
          break;
        case UpgradeToastWordingTestGroups.seeWhatsNew:
          buttonAction = "See what's new";
          break;
        default:
          assertUnreachable(toastWording);
      }

      vscode.window
        .showInformationMessage(
          `Dendron has been upgraded to ${version}`,
          buttonAction
        )
        .then((resp) => {
          if (resp === buttonAction) {
            AnalyticsUtils.track(VSCodeEvents.UpgradeSeeWhatsChangedClicked, {
              previousVersion: previousExtensionVersion,
              duration: getDurationMilliseconds(start),
              toastWording,
            });
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
  StartupUtils.showLapsedUserMessageIfNecessary({ assetUri });

  // Show inactive users (users who were active on first week but have not used lookup in 2 weeks)
  // a reminder prompt to re-engage them.
  StartupUtils.showInactiveUserMessageIfNecessary();
}

async function _setupCommands({
  ws,
  context,
  // If your command needs access to the engine at setup, requireActiveWorkspace should be set to true
  requireActiveWorkspace,
}: {
  ws: DendronExtension;
  context: vscode.ExtensionContext;
  requireActiveWorkspace: boolean;
}) {
  const existingCommands = await vscode.commands.getCommands();

  // add all commands
  ALL_COMMANDS.map((Cmd) => {
    // only process commands that match the filter
    if (Cmd.requireActiveWorkspace !== requireActiveWorkspace) {
      return;
    }
    const cmd = new Cmd(ws);
    if (isDisposable(cmd)) {
      context.subscriptions.push(cmd);
    }

    // Register commands that implement on `onAutoComplete` with AutoCompletableRegister
    // to be able to be invoked with auto completion action.
    if (isAutoCompletable(cmd)) {
      AutoCompletableRegistrar.register(cmd.key, cmd);
    }

    if (!existingCommands.includes(cmd.key))
      context.subscriptions.push(
        vscode.commands.registerCommand(
          cmd.key,
          sentryReportingCallback(async (args: any) => {
            await cmd.run(args);
          })
        )
      );
  });

  // ---
  if (requireActiveWorkspace === true) {
    if (!existingCommands.includes(DENDRON_COMMANDS.GO_NEXT_HIERARCHY.key)) {
      context.subscriptions.push(
        vscode.commands.registerCommand(
          DENDRON_COMMANDS.GO_NEXT_HIERARCHY.key,
          sentryReportingCallback(async () => {
            await new GoToSiblingCommand().execute({ direction: "next" });
          })
        )
      );
    }
    if (!existingCommands.includes(DENDRON_COMMANDS.GO_PREV_HIERARCHY.key)) {
      context.subscriptions.push(
        vscode.commands.registerCommand(
          DENDRON_COMMANDS.GO_PREV_HIERARCHY.key,
          sentryReportingCallback(async () => {
            await new GoToSiblingCommand().execute({ direction: "prev" });
          })
        )
      );
    }

    // RENAME is alias to MOVE
    if (!existingCommands.includes(DENDRON_COMMANDS.RENAME_NOTE.key)) {
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

    if (!existingCommands.includes(DENDRON_COMMANDS.SHOW_PREVIEW.key)) {
      context.subscriptions.push(
        vscode.commands.registerCommand(
          DENDRON_COMMANDS.SHOW_PREVIEW.key,
          sentryReportingCallback(async (args) => {
            if (args === undefined) {
              args = {};
            }
            await new ShowPreviewCommand(PreviewPanelFactory.create(ws)).run(
              args
            );
          })
        )
      );
    }

    if (!existingCommands.includes(DENDRON_COMMANDS.SHOW_SCHEMA_GRAPH.key)) {
      context.subscriptions.push(
        vscode.commands.registerCommand(
          DENDRON_COMMANDS.SHOW_SCHEMA_GRAPH.key,
          sentryReportingCallback(async () => {
            await new ShowSchemaGraphCommand(
              SchemaGraphViewFactory.create(ws)
            ).run();
          })
        )
      );
    }

    if (!existingCommands.includes(DENDRON_COMMANDS.SHOW_NOTE_GRAPH.key)) {
      context.subscriptions.push(
        vscode.commands.registerCommand(
          DENDRON_COMMANDS.SHOW_NOTE_GRAPH.key,
          sentryReportingCallback(async () => {
            await new ShowNoteGraphCommand(
              NoteGraphPanelFactory.create(ws, ws.getEngine())
            ).run();
          })
        )
      );
    }
  }

  // NOTE: seed commands currently DO NOT take extension as a first argument
  ExtensionUtils.addCommand({
    context,
    key: DENDRON_COMMANDS.SEED_ADD.key,
    cmd: new SeedAddCommand(),
    existingCommands,
  });

  ExtensionUtils.addCommand({
    context,
    key: DENDRON_COMMANDS.SEED_REMOVE.key,
    cmd: new SeedRemoveCommand(),
    existingCommands,
  });

  if (!existingCommands.includes(DENDRON_COMMANDS.SEED_BROWSE.key)) {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.SEED_BROWSE.key,
        sentryReportingCallback(async () => {
          const panel = WebViewPanelFactory.create(
            ws.workspaceService!.seedService
          );
          const cmd = new SeedBrowseCommand(panel);

          return cmd.run();
        })
      )
    );
  }
}

function _setupLanguageFeatures(context: vscode.ExtensionContext) {
  const mdLangSelector: vscode.DocumentFilter = {
    language: "markdown",
    scheme: "*",
  };
  const anyLangSelector: vscode.DocumentFilter = { scheme: "*" };
  context.subscriptions.push(
    vscode.languages.registerReferenceProvider(
      mdLangSelector,
      new ReferenceProvider()
    )
  );
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      // Allows definition provider to work for wikilinks in non-note files
      anyLangSelector,
      new DefinitionProvider()
    )
  );
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      // Allows hover provider to work for wikilinks in non-note files
      anyLangSelector,
      new ReferenceHoverProvider()
    )
  );
  context.subscriptions.push(
    vscode.languages.registerFoldingRangeProvider(
      mdLangSelector,
      new FrontmatterFoldingRangeProvider()
    )
  );
  context.subscriptions.push(
    vscode.languages.registerRenameProvider(
      mdLangSelector,
      new RenameProvider()
    )
  );
  completionProvider.activate(context);
  codeActionProvider.activate(context);
}

// ^qxkkg70u6w0z
function updateEngineAPI(
  port: number | string,
  ext: DendronExtension
): EngineAPIService {
  // set engine api ^9dr6chh7ah9v
  const svc = EngineAPIService.createEngine({
    port,
    enableWorkspaceTrust: vscode.workspace.isTrusted,
    vaults: ext.getDWorkspace().vaults,
    wsRoot: ext.getDWorkspace().wsRoot,
  });
  ext.setEngine(svc);
  ext.port = _.toInteger(port);

  return svc;
}
