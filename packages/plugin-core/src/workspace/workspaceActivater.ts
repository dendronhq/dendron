import { DWorkspaceV2, WorkspaceType } from "@dendronhq/common-all";
import { WorkspaceUtils } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { IDendronExtension } from "../dendronExtensionInterface";
import { Logger } from "../logger";
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
  async activate({ ext, context, wsRoot }: WorkspaceActivatorOpts) {
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
    return workspace;
  }

  async activateCodeWorkspace({ context, wsRoot }: WorkspaceActivatorOpts) {
    const assetUri = VSCodeUtils.getAssetUri(context);
    return new DendronCodeWorkspace({
      wsRoot,
      logUri: context.logUri,
      assetUri,
    });
  }

  async activateNativeWorkspace({ context, wsRoot }: WorkspaceActivatorOpts) {
    const assetUri = VSCodeUtils.getAssetUri(context);
    return new DendronNativeWorkspace({
      wsRoot,
      logUri: context.logUri,
      assetUri,
    });
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
