import "reflect-metadata";
import { SubProcessExitType } from "@dendronhq/api-server";
import * as Sentry from "@sentry/node";
import {
  ConfigService,
  CONSTANTS,
  DendronError,
  DVault,
  DWorkspaceV2,
  ErrorFactory,
  getStage,
  GitEvents,
  RespV3,
  TreeViewItemLabelTypeEnum,
  URI,
  VaultUtils,
  VSCodeEvents,
  WorkspaceType,
} from "@dendronhq/common-all";
import { getDurationMilliseconds, GitUtils } from "@dendronhq/common-server";
import {
  HistoryService,
  MetadataService,
  WorkspaceService,
  WorkspaceUtils,
} from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import semver from "semver";
import * as vscode from "vscode";
import { DendronContext, DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { Logger } from "../logger";
import { EngineAPIService } from "../services/EngineAPIService";
import { StateService } from "../services/stateService";
import { AnalyticsUtils, sentryReportingCallback } from "../utils/analytics";
import { ExtensionUtils } from "../utils/ExtensionUtils";
import { StartupUtils } from "../utils/StartupUtils";
import { VSCodeUtils } from "../vsCodeUtils";
import { DendronExtension } from "../workspace";
import { WSUtils } from "../WSUtils";
import { DendronCodeWorkspace } from "./codeWorkspace";
import { DendronNativeWorkspace } from "./nativeWorkspace";
import { WorkspaceInitFactory } from "./WorkspaceInitFactory";
import { WorkspaceInitializer } from "./workspaceInitializer";
import { CreateNoteCommand } from "../commands/CreateNoteCommand";
import { container } from "tsyringe";
import { NativeTreeView } from "../views/common/treeview/NativeTreeView";
import SparkMD5 from "spark-md5";
import { TextDocumentService } from "../services/node/TextDocumentService";

function _setupTreeViewCommands(
  treeView: NativeTreeView,
  existingCommands: string[]
) {
  if (
    !existingCommands.includes(DENDRON_COMMANDS.TREEVIEW_LABEL_BY_TITLE.key)
  ) {
    vscode.commands.registerCommand(
      DENDRON_COMMANDS.TREEVIEW_LABEL_BY_TITLE.key,
      sentryReportingCallback(() => {
        treeView.updateLabelType({
          labelType: TreeViewItemLabelTypeEnum.title,
        });
      })
    );
  }

  if (
    !existingCommands.includes(DENDRON_COMMANDS.TREEVIEW_LABEL_BY_FILENAME.key)
  ) {
    vscode.commands.registerCommand(
      DENDRON_COMMANDS.TREEVIEW_LABEL_BY_FILENAME.key,
      sentryReportingCallback(() => {
        treeView.updateLabelType({
          labelType: TreeViewItemLabelTypeEnum.filename,
        });
      })
    );
  }

  if (!existingCommands.includes(DENDRON_COMMANDS.TREEVIEW_CREATE_NOTE.key)) {
    vscode.commands.registerCommand(
      DENDRON_COMMANDS.TREEVIEW_CREATE_NOTE.key,
      sentryReportingCallback(async (opts) => {
        await new CreateNoteCommand().run(opts);
      })
    );
  }

  /**
   * This is a little flaky right now, but it works most of the time.
   * Leaving this for dev / debug purposes.
   * Enablement is set to be DendronContext.DEV_MODE
   *
   * TODO: fix tree item register issue and flip the dev mode flag.
   */
  if (!existingCommands.includes(DENDRON_COMMANDS.TREEVIEW_EXPAND_ALL.key)) {
    vscode.commands.registerCommand(
      DENDRON_COMMANDS.TREEVIEW_EXPAND_ALL.key,
      sentryReportingCallback(async () => {
        await treeView.expandAll();
      })
    );
  }

  if (!existingCommands.includes(DENDRON_COMMANDS.TREEVIEW_EXPAND_STUB.key)) {
    vscode.commands.registerCommand(
      DENDRON_COMMANDS.TREEVIEW_EXPAND_STUB.key,
      sentryReportingCallback(async (id) => {
        await treeView.expandTreeItem(id);
      })
    );
  }
}

export function trackTopLevelRepoFound(opts: { wsService: WorkspaceService }) {
  const { wsService } = opts;
  return wsService.getTopLevelRemoteUrl().then((remoteUrl) => {
    if (remoteUrl !== undefined) {
      const [protocol, provider, ...path] = GitUtils.parseGitUrl(remoteUrl);
      const payload = {
        protocol: protocol.replace(":", ""),
        provider,
        path: SparkMD5.hash(`${path[0]}/${path[1]}.git`),
      };
      AnalyticsUtils.track(GitEvents.TopLevelRepoFound, payload);
      return payload;
    }
    return undefined;
  });
}

function analyzeWorkspace({ wsService }: { wsService: WorkspaceService }) {
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
  trackTopLevelRepoFound({ wsService });
}

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

/**
 * Get version of Dendron when workspace was last activated
 */
async function getAndCleanPreviousWSVersion({
  wsService,
  stateService,
  ext,
}: {
  stateService: StateService;
  wsService: WorkspaceService;
  ext: IDendronExtension;
}) {
  let previousWorkspaceVersionFromWSService = wsService.getMeta().version;

  // Fix a temporary issue where CLI was writing an invalid version number
  // to .dendron.ws:
  if (previousWorkspaceVersionFromWSService === "dendron-cli") {
    previousWorkspaceVersionFromWSService = "0.91.0";
  }
  if (ext.type === WorkspaceType.NATIVE) {
    return previousWorkspaceVersionFromWSService;
  }

  // Code workspace specific code
  // Migration code: we used to store verion history in state vs metadata
  const previousWorkspaceVersionFromState = stateService.getWorkspaceVersion();
  if (
    !semver.valid(previousWorkspaceVersionFromWSService) ||
    semver.gt(
      previousWorkspaceVersionFromState,
      previousWorkspaceVersionFromWSService
    )
  ) {
    previousWorkspaceVersionFromWSService = previousWorkspaceVersionFromState;
    wsService.writeMeta({ version: previousWorkspaceVersionFromState });
  }
  return previousWorkspaceVersionFromWSService;
}

async function checkNoDuplicateVaultNames(vaults: DVault[]): Promise<boolean> {
  // check for vaults with same name
  const uniqueVaults = new Set<string>();
  const duplicates = new Set<string>();
  vaults.forEach((vault) => {
    const vaultName = VaultUtils.getName(vault);
    if (uniqueVaults.has(vaultName)) duplicates.add(vaultName);
    uniqueVaults.add(vaultName);
  });

  if (duplicates.size > 0) {
    const txt = "Fix it";
    const duplicateVaultNames = Array.from(duplicates).join(", ");
    await vscode.window
      .showErrorMessage(
        `Following vault names have duplicates: ${duplicateVaultNames} See https://dendron.so/notes/a6c03f9b-8959-4d67-8394-4d204ab69bfe.html#multiple-vaults-with-the-same-name to fix`,
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
  return true;
}

async function initTreeView({ context }: { context: vscode.ExtensionContext }) {
  const existingCommands = await vscode.commands.getCommands();
  const treeView = container.resolve(NativeTreeView);
  treeView.show();
  _setupTreeViewCommands(treeView, existingCommands);
  context.subscriptions.push(treeView);
}

async function postReloadWorkspace({
  wsService,
}: {
  wsService: WorkspaceService;
}) {
  const ctx = "postReloadWorkspace";
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

async function reloadWorkspace({
  ext,
  wsService,
}: {
  ext: IDendronExtension;
  wsService: WorkspaceService;
}) {
  const ctx = "reloadWorkspace";
  const ws = ext.getDWorkspace();
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

  await postReloadWorkspace({ wsService });
  HistoryService.instance().add({
    source: "extension",
    action: "initialized",
  });
  return maybeEngine;
}

function togglePluginActiveContext(enabled: boolean) {
  const ctx = "togglePluginActiveContext";
  Logger.info({ ctx, state: `togglePluginActiveContext: ${enabled}` });
  VSCodeUtils.setContext(DendronContext.PLUGIN_ACTIVE, enabled);
  VSCodeUtils.setContext(DendronContext.HAS_CUSTOM_MARKDOWN_VIEW, enabled);
}

async function updateEngineAPI(
  port: number | string,
  ext: IDendronExtension
): Promise<EngineAPIService> {
  // set engine api ^9dr6chh7ah9v
  const svc = await EngineAPIService.createEngine({
    port,
    enableWorkspaceTrust: vscode.workspace.isTrusted,
    vaults: await ext.getDWorkspace().vaults,
    wsRoot: ext.getDWorkspace().wsRoot,
  });
  ext.setEngine(svc);
  ext.port = _.toInteger(port);

  return svc;
}

type WorkspaceActivatorValidateOpts = {
  ext: IDendronExtension;
  context: vscode.ExtensionContext;
};

type WorkspaceActivatorOpts = {
  ext: IDendronExtension;
  context: vscode.ExtensionContext;
  wsRoot: string;
  workspaceInitializer?: WorkspaceInitializer;
};

type WorkspaceActivatorSkipOpts = {
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
  }>;
};
export class WorkspaceActivator {
  /**
   * Initialize workspace. All logic that happens before the engine is initialized happens here
   * - create workspace class
   * - register traits
   * - run migrations if necessary
   */
  async init({
    ext,
    context,
    wsRoot,
    opts,
  }: WorkspaceActivatorOpts & WorkspaceActivatorSkipOpts): Promise<
    RespV3<{
      workspace: DWorkspaceV2;
      engine: EngineAPIService;
      wsService: WorkspaceService;
    }>
  > {
    const ctx = "WorkspaceActivator.init";
    // --- Setup workspace
    let workspace: DWorkspaceV2;
    if (ext.type === WorkspaceType.NATIVE) {
      workspace = this.initNativeWorkspace({ ext, context, wsRoot });
      if (!workspace) {
        return {
          error: ErrorFactory.createInvalidStateError({
            message: "could not find native workspace",
          }),
        };
      }
    } else {
      workspace = this.initCodeWorkspace({ ext, context, wsRoot });
    }

    ext.workspaceImpl = workspace;
    // HACK: Only set up note traits after workspaceImpl has been set, so that
    // the wsRoot path is known for locating the note trait definition location.
    if (vscode.workspace.isTrusted) {
      ext.traitRegistrar.initialize();
    } else {
      Logger.info({
        msg: "User specified note traits not initialized because workspace is not trusted.",
      });
    }

    // --- Initialization
    Logger.info({ ctx: `${ctx}:postSetupTraits`, wsRoot });
    const currentVersion = DendronExtension.version();
    const wsService = new WorkspaceService({ wsRoot });
    const configReadResult = await ConfigService.instance().readConfig(
      URI.file(wsRoot)
    );
    if (configReadResult.isErr()) {
      throw configReadResult.error;
    }
    const dendronConfig = configReadResult.value;
    const stateService = new StateService({
      globalState: context.globalState,
      workspaceState: context.workspaceState,
    });
    ext.workspaceService = wsService;

    // get previous workspace version and fixup
    const previousWorkspaceVersion = await getAndCleanPreviousWSVersion({
      wsService,
      stateService,
      ext,
    });

    // run migrations
    const maybeWsSettings =
      ext.type === WorkspaceType.CODE
        ? wsService.getCodeWorkspaceSettingsSync()
        : undefined;
    if (!opts?.skipMigrations) {
      await StartupUtils.showManualUpgradeMessageIfNecessary({
        previousWorkspaceVersion,
        currentVersion,
      });

      await StartupUtils.runMigrationsIfNecessary({
        wsService,
        currentVersion,
        previousWorkspaceVersion,
        maybeWsSettings,
        dendronConfig,
      });
    }
    Logger.info({ ctx: `${ctx}:postMigration`, wsRoot });

    // show interactive elements,
    if (!opts?.skipInteractiveElements) {
      // check for duplicate config keys and prompt for a fix.
      await StartupUtils.showDuplicateConfigEntryMessageIfNecessary({
        ext,
      });
    }

    // initialize vaults, clone remote vaults if needed
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
        // TODO: remove
        setTimeout(VSCodeUtils.reloadWindow, 200);
      },
    });
    if (didClone) {
      return {
        error: ErrorFactory.createInvalidStateError({
          message: "could not initialize workspace",
        }),
      };
    }
    Logger.info({ ctx: `${ctx}:postWsServiceInitialize`, wsRoot });

    // check for vaults with duplicates
    const vaults = await wsService.vaults;
    const respNoDupVault = await checkNoDuplicateVaultNames(vaults);
    if (!respNoDupVault) {
      return {
        error: ErrorFactory.createInvalidStateError({
          message: "found duplicate vaults",
        }),
      };
    }

    // write new workspace version
    wsService.writeMeta({ version: DendronExtension.version() });

    // setup engine
    const port = await this.verifyOrStartServerProcess({ ext, wsService });
    Logger.info({ ctx: `${ctx}:verifyOrStartServerProcess`, port });
    const engine = await updateEngineAPI(port, ext);
    Logger.info({ ctx: `${ctx}:exit` });

    return { data: { workspace, engine, wsService } };
  }

  /**
   * Initialize engine and activate workspace watchers
   */
  async activate({
    ext,
    context,
    wsService,
    wsRoot,
    opts,
    workspaceInitializer,
  }: WorkspaceActivatorOpts &
    WorkspaceActivatorSkipOpts & {
      engine: EngineAPIService;
      wsService: WorkspaceService;
    }): Promise<RespV3<boolean>> {
    const ctx = "WorkspaceActivator:activate";
    // setup services
    context.subscriptions.push(container.resolve(TextDocumentService));

    // Reload
    WSUtils.showActivateProgress();
    const start = process.hrtime();
    const reloadSuccess = await reloadWorkspace({ ext, wsService });
    const durationReloadWorkspace = getDurationMilliseconds(start);

    // NOTE: tracking is not awaited, don't block on this
    ExtensionUtils.trackWorkspaceInit({
      durationReloadWorkspace,
      activatedSuccess: !!reloadSuccess,
      ext,
    }).catch((error) => {
      Sentry.captureException(error);
    });

    analyzeWorkspace({ wsService });

    if (!reloadSuccess) {
      HistoryService.instance().add({
        source: "extension",
        action: "not_initialized",
      });
      return {
        error: ErrorFactory.createInvalidStateError({
          message: `issue with init`,
        }),
      };
    }

    const config = await wsService.config;
    ExtensionUtils.setWorkspaceContextOnActivate(config);
    MetadataService.instance().setDendronWorkspaceActivated();
    Logger.info({ ctx, msg: "fin startClient", durationReloadWorkspace });

    const stage = getStage();
    if (stage !== "test") {
      ext.activateWatchers();
      togglePluginActiveContext(true);
    }

    // Setup tree view
    // This needs to happen after activation because we need the engine.
    if (!opts?.skipTreeView) {
      await initTreeView({
        context,
      });
    }

    // Add the current workspace to the recent workspace list. The current
    // workspace is either the workspace file (Code Workspace) or the current
    // folder (Native Workspace)
    const workspace = DendronExtension.tryWorkspaceFile()?.fsPath || wsRoot;
    MetadataService.instance().addToRecentWorkspaces(workspace);

    if (workspaceInitializer?.onWorkspaceActivate) {
      workspaceInitializer.onWorkspaceActivate({
        skipOpts: opts,
      });
    } else {
      const initializer = WorkspaceInitFactory.create();
      if (initializer && initializer.onWorkspaceActivate) {
        initializer.onWorkspaceActivate({
          skipOpts: opts,
        });
      }
    }
    return { data: true };
  }

  initCodeWorkspace({ context, wsRoot }: WorkspaceActivatorOpts) {
    const assetUri = VSCodeUtils.getAssetUri(context);
    const ws = new DendronCodeWorkspace({
      wsRoot,
      logUri: context.logUri,
      assetUri,
    });
    return ws;
  }

  initNativeWorkspace({ context, wsRoot }: WorkspaceActivatorOpts) {
    const assetUri = VSCodeUtils.getAssetUri(context);
    const ws = new DendronNativeWorkspace({
      wsRoot,
      logUri: context.logUri,
      assetUri,
    });
    return ws;
  }

  async getOrPromptWsRoot({
    ext,
  }: WorkspaceActivatorValidateOpts): Promise<string | undefined> {
    if (ext.type === WorkspaceType.NATIVE) {
      const workspaceFolders =
        await WorkspaceUtils.findWSRootsInWorkspaceFolders(
          DendronExtension.workspaceFolders()!
        );
      if (!workspaceFolders) {
        return;
      }
      const resp = await getOrPromptWSRoot(workspaceFolders);
      if (!_.isString(resp)) {
        return;
      }
      return resp;
    } else {
      return path.dirname(DendronExtension.workspaceFile().fsPath);
    }
  }

  /**
   * Return true if we started a server process
   * @returns
   */
  async verifyOrStartServerProcess({
    ext,
    wsService,
  }: {
    ext: IDendronExtension;
    wsService: WorkspaceService;
  }): Promise<number> {
    const context = ext.context;
    const start = process.hrtime();
    if (ext.port) {
      return ext.port;
    }

    const { port, subprocess } = await ExtensionUtils.startServerProcess({
      context,
      start,
      wsService,
      onExit: (type: SubProcessExitType) => {
        const txt = "Restart Dendron";
        vscode.window
          .showErrorMessage("Dendron engine encountered an error", txt)
          .then(async (resp) => {
            if (resp === txt) {
              AnalyticsUtils.track(VSCodeEvents.ServerCrashed, {
                code: type,
              });
              await ExtensionUtils.activate();
            }
          });
      },
    });
    ext.port = _.toInteger(port);
    ext.serverProcess = subprocess;
    return ext.port;
  }
}
