import "reflect-metadata"; // This needs to be the topmost import for tsyringe to work

import {
  ConfigService,
  CONSTANTS,
  DWorkspaceV2,
  getStage,
  GLOBAL_STATE_KEYS,
  GraphEvents,
  GraphThemeEnum,
  GraphThemeTestGroups,
  GRAPH_THEME_TEST,
  InstallStatus,
  isDisposable,
  URI,
  VSCodeEvents,
  WorkspaceEvents,
} from "@dendronhq/common-all";
import {
  getDurationMilliseconds,
  getOS,
  initializeSentry,
  SegmentClient,
} from "@dendronhq/common-server";
import {
  HistoryService,
  MetadataService,
  NodeJSFileStore,
  WorkspaceUtils,
} from "@dendronhq/engine-server";
import * as Sentry from "@sentry/node";
import fs from "fs-extra";
import _ from "lodash";
import os from "os";
import path from "path";
import semver from "semver";
import * as vscode from "vscode";
import { ALL_COMMANDS } from "./commands";
import { ConfigureWithUICommand } from "./commands/ConfigureWithUICommand";
import { GotoNoteCommand } from "./commands/GotoNote";
import { GoToSiblingCommand } from "./commands/GoToSiblingCommand";
import { ReloadIndexCommand } from "./commands/ReloadIndex";
import { SeedAddCommand } from "./commands/SeedAddCommand";
import {
  SeedBrowseCommand,
  WebViewPanelFactory,
} from "./commands/SeedBrowseCommand";
import { SeedRemoveCommand } from "./commands/SeedRemoveCommand";
import { ShowNoteGraphCommand } from "./commands/ShowNoteGraph";
import { ShowSchemaGraphCommand } from "./commands/ShowSchemaGraph";
import { TogglePreviewCommand } from "./commands/TogglePreview";
import { TogglePreviewLockCommand } from "./commands/TogglePreviewLock";
import { ConfigureUIPanelFactory } from "./components/views/ConfigureUIPanelFactory";
import { NoteGraphPanelFactory } from "./components/views/NoteGraphViewFactory";
import { PreviewPanelFactory } from "./components/views/PreviewViewFactory";
import { SchemaGraphViewFactory } from "./components/views/SchemaGraphViewFactory";
import { DendronContext, DENDRON_COMMANDS } from "./constants";
import { codeActionProvider } from "./features/codeActionProvider";
import { completionProvider } from "./features/completionProvider";
import DefinitionProvider from "./features/DefinitionProvider";
import FrontmatterFoldingRangeProvider from "./features/FrontmatterFoldingRangeProvider";
import setupHelpFeedbackTreeView from "./features/HelpFeedbackTreeview";
import setupRecentWorkspacesTreeView from "./features/RecentWorkspacesTreeview";
import ReferenceHoverProvider from "./features/ReferenceHoverProvider";
import ReferenceProvider from "./features/ReferenceProvider";
import RenameProvider from "./features/RenameProvider";
import { setupLocalExtContainer } from "./injection-providers/setupLocalExtContainer";
import { KeybindingUtils } from "./KeybindingUtils";
import { Logger } from "./logger";
import { StateService } from "./services/stateService";
import { Extensions } from "./settings";
import { CreateScratchNoteKeybindingTip } from "./showcase/CreateScratchNoteKeybindingTip";
import { FeatureShowcaseToaster } from "./showcase/FeatureShowcaseToaster";
import { SurveyUtils } from "./survey";
import { AnalyticsUtils, sentryReportingCallback } from "./utils/analytics";
import { ExtensionUtils } from "./utils/ExtensionUtils";
import { StartupUtils } from "./utils/StartupUtils";
import { VSCodeUtils } from "./vsCodeUtils";
import { showWelcome } from "./WelcomeUtils";
import { DendronExtension, getDWorkspace, getExtension } from "./workspace";
import { TutorialInitializer } from "./workspace/tutorialInitializer";
import { WorkspaceActivator } from "./workspace/workspaceActivator";
import { WSUtils } from "./WSUtils";

const MARKDOWN_WORD_PATTERN = new RegExp("([\\w\\.]+)");
// === Main

// this method is called when your extension is activated
export function activate(
  context: vscode.ExtensionContext
): vscode.ExtensionContext {
  const stage = getStage();
  // override default word pattern
  vscode.languages.setLanguageConfiguration("markdown", {
    wordPattern: MARKDOWN_WORD_PATTERN,
  });
  if (stage !== "test") {
    _activate(context).catch((err) => {
      Logger.error({
        ctx: "activate",
        error: err,
      });
      HistoryService.instance().add({
        action: "not_initialized",
        source: "extension",
        data: { err },
      });
    });
  }
  return context;
}

// Only exported for test purposes ^jtm6bf7utsxy
export async function _activate(
  context: vscode.ExtensionContext,
  opts?: Partial<{
    /**
     * Skip setting up language features (eg. code action providesr)
     */
    skipLanguageFeatures: boolean;
    /**
     * Skip automatic migrations on start
     */
    skipMigrations: boolean;
    /**
     * Skip surfacing dialogues on startup
     */
    skipInteractiveElements: boolean;

    /**
     * Skip showing tree view
     */
    skipTreeView: boolean;
  }>
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

  // Config service instantiation as early as possible
  ConfigService.instance({
    homeDir: URI.file(os.homedir()),
    fileStore: new NodeJSFileStore(),
  });

  // At this point, the segment client has not been created yet.
  // We need to check here if the uuid has been set for future references
  // because the Segment client constructor will go ahead and create one if it doesn't exist.
  const maybeUUIDPath = path.join(os.homedir(), CONSTANTS.DENDRON_ID);
  const UUIDPathExists = await fs.pathExists(maybeUUIDPath);

  // this is the first time we are accessing the segment client instance.
  // unlock Segment client.
  SegmentClient.unlock();

  // If telemetry is not disabled, we enable telemetry and error reporting ^rw8l1w51hnjz
  // - NOTE: we do this outside of the try/catch block in case we run into an error with initialization
  if (!SegmentClient.instance().hasOptedOut && getStage() === "prod") {
    initializeSentry({
      environment: getStage(),
      sessionId: AnalyticsUtils.getSessionId(),
      release: AnalyticsUtils.getVSCodeSentryRelease(),
    });

    // Temp: store the user's anonymous ID into global state so that we can link
    // local ext users to web ext users. If one already exists in global state,
    // then override that one with the segment client one.
    context.globalState.setKeysForSync([GLOBAL_STATE_KEYS.ANONYMOUS_ID]);

    const segmentAnonymousId = SegmentClient.instance().anonymousId;

    const globalStateId = context.globalState.get<string | undefined>(
      GLOBAL_STATE_KEYS.ANONYMOUS_ID
    );

    if (globalStateId !== segmentAnonymousId) {
      if (globalStateId) {
        AnalyticsUtils.track(WorkspaceEvents.MultipleTelemetryIdsDetected, {
          ids: [segmentAnonymousId, globalStateId],
        });
      }
      context.globalState.update(
        GLOBAL_STATE_KEYS.ANONYMOUS_ID,
        SegmentClient.instance().anonymousId
      );
    }
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
    const existingCommands = await vscode.commands.getCommands();

    // Setup the commands
    await _setupCommands({ ext: ws, context, requireActiveWorkspace: false });
    // Order matters. Need to register `Reload Index` command before activating workspace
    // Workspace activation calls `RELOAD_INDEX` via {@link WSUtils.reloadWorkspace}
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
    await _setupCommands({ ext: ws, context, requireActiveWorkspace: true });

    if (!opts?.skipLanguageFeatures) {
      _setupLanguageFeatures(context);
    }

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

    const previousGlobalVersion = MetadataService.instance().getGlobalVersion();

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

    // Setup the help and feedback and recent workspaces views here so that it still works even if
    // we're not in a Dendron workspace.
    context.subscriptions.push(setupHelpFeedbackTreeView());
    context.subscriptions.push(setupRecentWorkspacesTreeView());

    if (await DendronExtension.isDendronWorkspace()) {
      const activator = new WorkspaceActivator();
      const maybeWsRoot = await activator.getOrPromptWsRoot({
        ext: ws,
        context,
      });
      if (!maybeWsRoot) {
        return false;
      }
      const resp = await activator.init({
        ext: ws,
        context,
        wsRoot: maybeWsRoot,
      });
      if (resp.error) {
        return false;
      }
      const wsImpl: DWorkspaceV2 = resp.data.workspace;

      // setup extension container
      setupLocalExtContainer({
        wsRoot: maybeWsRoot,
        vaults: await wsImpl.vaults,
        engine: resp.data.engine,
        config: await resp.data.workspace.config,
        context,
      });

      // preview commands requires tsyringe dependencies to be registered beforehand
      _setupPreviewCommands(context);
      // initialize Segment client
      AnalyticsUtils.setupSegmentWithCacheFlush({ context, ws: wsImpl });

      // show interactive elements when **extension starts**
      if (!opts?.skipInteractiveElements) {
        // check if localhost is blocked
        StartupUtils.showWhitelistingLocalhostDocsIfNecessary();
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
      }

      // Re-use the id for error reporting too:
      Sentry.setUser({ id: SegmentClient.instance().anonymousId });

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
        ctx: ctx + ":postSetupWorkspace",
        platform,
        extensions,
        vaults: await wsImpl.vaults,
      });

      // --- Start Initializating the Engine
      const wsService = resp.data.wsService;
      const respActivate = await activator.activate({
        ext: ws,
        context,
        wsRoot: maybeWsRoot,
        engine: resp.data.engine,
        wsService,
        opts,
      });
      if (respActivate.error) {
        return false;
      }
      if (!opts?.skipInteractiveElements) {
        // on first install, warn if extensions are incompatible ^dlx35gstwsun
        if (extensionInstallStatus === InstallStatus.INITIAL_INSTALL) {
          StartupUtils.warnIncompatibleExtensions({ ext: ws });
        }
        // Show the feature showcase toast one minute after initialization.
        const ONE_MINUTE_IN_MS = 60_000;
        setTimeout(() => {
          const showcase = new FeatureShowcaseToaster();
          // Temporarily show the new toast instead of the rest.
          // for subsequent sessions this will not be shown as it already has been shown.
          // TODO: remove this special treatment after 1~2 weeks.
          let hasShown = false;
          // only show for users installed prior to v113
          const firstInstallVersion =
            MetadataService.instance().firstInstallVersion;
          if (
            firstInstallVersion === undefined ||
            semver.lt(firstInstallVersion, "0.113.0")
          ) {
            hasShown = showcase.showSpecificToast(
              new CreateScratchNoteKeybindingTip()
            );
          }
          if (!hasShown) {
            showcase.showToast();
          }
        }, ONE_MINUTE_IN_MS);
      }
      if (ExtensionUtils.isEnterprise(context)) {
        let resp: boolean | undefined | string = true;
        while (!ExtensionUtils.hasValidLicense() && resp !== undefined) {
          // eslint-disable-next-line no-await-in-loop
          resp = await SurveyUtils.showEnterpriseLicenseSurvey();
        }
        if (resp === undefined) {
          vscode.window.showInformationMessage(
            "Please reload to enter your license key",
            {
              modal: true,
              detail:
                "Dendron will be inactive until you enter a license key. You can reload your vscode instance to be prompted again",
            }
          );
          return false;
        }
      }
    } else {
      // ws not active
      Logger.info({ ctx, msg: "dendron not active" });
      AnalyticsUtils.setupSegmentWithCacheFlush({ context });
      Sentry.setUser({ id: SegmentClient.instance().anonymousId });
    }

    if (extensionInstallStatus === InstallStatus.INITIAL_INSTALL) {
      // if keybinding conflict is detected, let the users know and guide them how to resolve  ^rikhd9cc0rwb
      await KeybindingUtils.maybePromptKeybindingConflict();
      // if user hasn't opted out of telemetry, notify them about it ^njhii5plxmxr
      if (!SegmentClient.instance().hasOptedOut) {
        AnalyticsUtils.showTelemetryNotice();
      }
    }

    if (!opts?.skipInteractiveElements) {
      await showWelcomeOrWhatsNew({
        extensionInstallStatus,
        isSecondaryInstall,
        version: DendronExtension.version(),
        previousExtensionVersion: previousWorkspaceVersionFromState,
        start: startActivate,
        assetUri,
        context,
      });
    }

    if (DendronExtension.isActive(context)) {
      HistoryService.instance().add({
        source: "extension",
        action: "activate",
      });
      // If automaticallyShowPreview = true, display preview panel on start up
      const config = await ws.workspaceService?.config;
      const note = await WSUtils.getActiveNote();
      if (note && config && config.preview?.automaticallyShowPreview) {
        await PreviewPanelFactory.create().show(note);
      }
      StartupUtils.showUninstallMarkdownLinksExtensionMessage();
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
  context,
}: {
  extensionInstallStatus: InstallStatus;
  isSecondaryInstall: boolean;
  version: string;
  previousExtensionVersion: string;
  start: [number, number];
  assetUri: vscode.Uri;
  context: vscode.ExtensionContext;
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

      // Explicitly set the tutorial split test group in the Install event as
      // well, since Amplitude may not have the user props splitTest setup in time
      // before this install event reaches their backend.
      const group = TutorialInitializer.getTutorialType();
      const installTrackProps = {
        duration: getDurationMilliseconds(start),
        isSecondaryInstall,
        tutorialGroup: group,
      };
      const { codeFolderCreated, ageOfCodeInstallInWeeks } =
        ExtensionUtils.getCodeFolderCreated({
          context,
        });
      if (codeFolderCreated) {
        _.set(installTrackProps, "codeFolderCreated", codeFolderCreated);
      }
      if (ageOfCodeInstallInWeeks) {
        _.set(
          installTrackProps,
          "ageOfCodeInstallInWeeks",
          ageOfCodeInstallInWeeks
        );
      }
      // track how long install process took ^e8itkyfj2rn3
      AnalyticsUtils.track(VSCodeEvents.Install, installTrackProps);

      metadataService.setGlobalVersion(version);

      // show the welcome page ^ygtm7ofzezwd
      return showWelcome(assetUri);
    }
    case InstallStatus.UPGRADED: {
      Logger.info({
        ctx,
        msg: "extension, new version",
        version,
        previousExtensionVersion,
      });

      metadataService.setGlobalVersion(version);

      AnalyticsUtils.track(VSCodeEvents.Upgrade, {
        previousVersion: previousExtensionVersion,
        duration: getDurationMilliseconds(start),
      });

      const buttonAction = "See what's new";

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

  // NOTE: these two prompts are disabled for now. uncomment to renable when needed.
  // Show lapsed users (users who have installed Dendron but haven't initialied
  // a workspace) a reminder prompt to re-engage them.
  // StartupPrompts.showLapsedUserMessageIfNecessary({ assetUri });

  // Show inactive users (users who were active on first week but have not used lookup in 2 weeks)
  // a reminder prompt to re-engage them.
  // StartupUtils.showInactiveUserMessageIfNecessary();
}

async function _setupCommands({
  ext,
  context,
  // If your command needs access to the engine at setup, requireActiveWorkspace should be set to true
  requireActiveWorkspace,
}: {
  ext: DendronExtension;
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
    const cmd = new Cmd(ext);
    if (isDisposable(cmd)) {
      context.subscriptions.push(cmd);
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

    if (!existingCommands.includes(DENDRON_COMMANDS.SHOW_SCHEMA_GRAPH.key)) {
      context.subscriptions.push(
        vscode.commands.registerCommand(
          DENDRON_COMMANDS.SHOW_SCHEMA_GRAPH.key,
          sentryReportingCallback(async () => {
            await new ShowSchemaGraphCommand(
              SchemaGraphViewFactory.create(ext)
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
              NoteGraphPanelFactory.create(ext, ext.getEngine())
            ).run();
          })
        )
      );
    }

    if (!existingCommands.includes(DENDRON_COMMANDS.CONFIGURE_UI.key)) {
      context.subscriptions.push(
        vscode.commands.registerCommand(
          DENDRON_COMMANDS.CONFIGURE_UI.key,
          sentryReportingCallback(async () => {
            await new ConfigureWithUICommand(
              ConfigureUIPanelFactory.create(ext)
            ).run();
          })
        )
      );
    }
    if (!existingCommands.includes(DENDRON_COMMANDS.TREEVIEW_GOTO_NOTE.key)) {
      context.subscriptions.push(
        vscode.commands.registerCommand(
          DENDRON_COMMANDS.TREEVIEW_GOTO_NOTE.key,
          sentryReportingCallback(async (id: string) => {
            const resp = await ext.getEngine().getNoteMeta(id);
            const { data } = resp;
            await new GotoNoteCommand(ext).run({
              qs: data?.fname,
              vault: data?.vault,
            });
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
            ext.workspaceService!.seedService
          );
          const cmd = new SeedBrowseCommand(panel);

          return cmd.run();
        })
      )
    );
  }
}

async function _setupPreviewCommands(context: vscode.ExtensionContext) {
  const existingCommands = await vscode.commands.getCommands();
  const preview = PreviewPanelFactory.create();

  if (!existingCommands.includes(DENDRON_COMMANDS.TOGGLE_PREVIEW.key)) {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.TOGGLE_PREVIEW.key,
        sentryReportingCallback(async (args) => {
          if (args === undefined) {
            args = {};
          }
          await new TogglePreviewCommand(preview).run(args);
        })
      )
    );
  }

  if (!existingCommands.includes(DENDRON_COMMANDS.TOGGLE_PREVIEW_LOCK.key)) {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.TOGGLE_PREVIEW_LOCK.key,
        sentryReportingCallback(async (args) => {
          if (args === undefined) {
            args = {};
          }
          await new TogglePreviewLockCommand(preview).run(args);
        })
      )
    );
  }
}

function _setupLanguageFeatures(context: vscode.ExtensionContext) {
  const mdLangSelector: vscode.DocumentFilter = {
    language: "markdown",
    scheme: "file",
  };
  const anyLangSelector: vscode.DocumentFilter = { scheme: "file" };
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
