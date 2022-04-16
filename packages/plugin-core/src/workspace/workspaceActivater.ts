import { DWorkspaceV2, WorkspaceType } from "@dendronhq/common-all";
import { WorkspaceUtils } from "@dendronhq/engine-server";
import { Logger } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";
import { DendronExtension } from "../workspace";
import * as vscode from "vscode";
import { DendronNativeWorkspace } from "./nativeWorkspace";
import { DendronCodeWorkspace } from "./codeWorkspace";
import path from "path";

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

type WorkspaceActivatorOpts = {
  ext: DendronExtension;
  context: vscode.ExtensionContext;
};

export class WorkspaceActivator {
  async activate({ ext, context }: WorkspaceActivatorOpts) {
    // --- Setup workspace
    let workspace: DWorkspaceV2 | boolean;
    if (ext.type === WorkspaceType.NATIVE) {
      workspace = await this.activateNativeWorkspace({ ext, context });
      if (!workspace) {
        return;
      }
    } else {
      workspace = await this.activateCodeWorkspace({ ext, context });
    }

    // --- Setup Traits
    ext.workspaceImpl = workspace;
    // Only set up note traits after workspaceImpl has been set, so that the
    // wsRoot path is known for locating the note trait definition location.
    ext.setupTraits();
    return workspace;
  }

  async activateCodeWorkspace({ context }: WorkspaceActivatorOpts) {
    const assetUri = VSCodeUtils.getAssetUri(context);
    return new DendronCodeWorkspace({
      wsRoot: path.dirname(DendronExtension.workspaceFile().fsPath),
      logUri: context.logUri,
      assetUri,
    });
  }

  async activateNativeWorkspace({ context }: WorkspaceActivatorOpts) {
    const workspaceFolders = await WorkspaceUtils.findWSRootsInWorkspaceFolders(
      DendronExtension.workspaceFolders()!
    );
    if (!workspaceFolders) {
      return false;
    }
    const wsRoot = await getOrPromptWSRoot(workspaceFolders);
    if (!wsRoot) return false;
    const assetUri = VSCodeUtils.getAssetUri(context);
    return new DendronNativeWorkspace({
      wsRoot,
      logUri: context.logUri,
      assetUri,
    });
  }
}
