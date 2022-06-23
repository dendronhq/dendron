import { DWorkspaceV2, WorkspaceType } from "@dendronhq/common-all";
import { WorkspaceService, WorkspaceUtils } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import semver from "semver";
import * as vscode from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
import { Logger } from "../logger";
import { StateService } from "../services/stateService";
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
  async activate({
    ext,
    context,
    wsRoot,
    skipMigrations,
  }: WorkspaceActivatorOpts & { skipMigrations?: boolean }) {
    // --- Setup workspace
    let workspace: DWorkspaceV2 | boolean;
    if (ext.type === WorkspaceType.NATIVE) {
      workspace = await this.activateNativeWorkspace({ ext, context, wsRoot });
      if (!workspace) {
        return;
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
    const previousWorkspaceVersion = await getAndCleanPreviousWSVersion({
      wsService,
      stateService,
      ext,
    });

    const maybeWsSettings =
      ext.type === WorkspaceType.CODE
        ? wsService.getCodeWorkspaceSettingsSync()
        : undefined;
    if (!skipMigrations) {
      await StartupUtils.runMigrationsIfNecessary({
        wsService,
        currentVersion,
        previousWorkspaceVersion,
        maybeWsSettings,
        dendronConfig,
      });
    }

    return workspace;
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
}
