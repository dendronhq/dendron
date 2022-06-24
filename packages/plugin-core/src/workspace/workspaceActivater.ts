import { SubProcessExitType } from "@dendronhq/api-server";
import {
  DVault,
  DWorkspaceV2,
  ErrorFactory,
  RespV3,
  VaultUtils,
  VSCodeEvents,
  WorkspaceType,
} from "@dendronhq/common-all";
import { WorkspaceService, WorkspaceUtils } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import semver from "semver";
import * as vscode from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
import { Logger } from "../logger";
import { EngineAPIService } from "../services/EngineAPIService";
import { StateService } from "../services/stateService";
import { AnalyticsUtils } from "../utils/analytics";
import { ExtensionUtils } from "../utils/ExtensionUtils";
import { StartupUtils } from "../utils/StartupUtils";
import { VSCodeUtils } from "../vsCodeUtils";
import { DendronExtension } from "../workspace";
import { DendronCodeWorkspace } from "./codeWorkspace";
import { DendronNativeWorkspace } from "./nativeWorkspace";

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
    return "previousWorkspaceVersionFromWSService";
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
  return true;
}

function updateEngineAPI(
  port: number | string,
  ext: IDendronExtension
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

type WorkspaceActivatorValidateOpts = {
  ext: IDendronExtension;
  context: vscode.ExtensionContext;
};

type WorkspaceActivatorOpts = {
  ext: IDendronExtension;
  context: vscode.ExtensionContext;
  wsRoot: string;
};

export class WorkspaceActivator {
  /**
   * Activate workspace
   *
   * Implies:
   * - check workspace version and do init logic if needed
   */
  async init({
    ext,
    context,
    wsRoot,
    opts,
  }: WorkspaceActivatorOpts & {
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
  }): Promise<RespV3<{ workspace: DWorkspaceV2; engine: EngineAPIService }>> {
    // --- Setup workspace
    let workspace: DWorkspaceV2;
    if (ext.type === WorkspaceType.NATIVE) {
      workspace = await this.activateNativeWorkspace({ ext, context, wsRoot });
      if (!workspace) {
        return {
          error: ErrorFactory.createInvalidStateError({
            message: "could not find native workspace",
          }),
        };
      }
    } else {
      workspace = await this.activateCodeWorkspace({ ext, context, wsRoot });
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
    const currentVersion = DendronExtension.version();
    const wsService = new WorkspaceService({ wsRoot });
    const dendronConfig = workspace.config;
    const stateService = new StateService({
      globalState: context.globalState,
      workspaceState: context.workspaceState,
    });

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
      await StartupUtils.runMigrationsIfNecessary({
        wsService,
        currentVersion,
        previousWorkspaceVersion,
        maybeWsSettings,
        dendronConfig,
      });
    }

    // show interactive elements,
    if (opts?.skipInteractiveElements) {
      // check for duplicate config keys and prompt for a fix.
      StartupUtils.showDuplicateConfigEntryMessageIfNecessary({
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

    // check for vaults with duplicates
    const respNoDupVault = await checkNoDuplicateVaultNames(wsService.vaults);
    if (!respNoDupVault) {
      return {
        error: ErrorFactory.createInvalidStateError({
          message: "found duplicate vaults",
        }),
      };
    }

    // write new workspace version
    wsService.writeMeta({ version: DendronExtension.version() });

    const port = await this.verifyOrStartServerProcess({ ext, wsService });
    // Setup the Engine API Service and the tree view
    const engineAPIService = updateEngineAPI(port, ext);

    return { data: { workspace, engine: engineAPIService } };
  }

  async activateCodeWorkspace({ context, wsRoot }: WorkspaceActivatorOpts) {
    const assetUri = VSCodeUtils.getAssetUri(context);
    const ws = new DendronCodeWorkspace({
      wsRoot,
      logUri: context.logUri,
      assetUri,
    });
    return ws;
  }

  async activateNativeWorkspace({ context, wsRoot }: WorkspaceActivatorOpts) {
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
