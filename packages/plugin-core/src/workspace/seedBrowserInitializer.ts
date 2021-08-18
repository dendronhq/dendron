import { DVault } from "@dendronhq/common-all";
import { WorkspaceService } from "@dendronhq/engine-server";
import { SeedBrowseCommand } from "../commands/SeedBrowseCommand";
import { GLOBAL_STATE, WORKSPACE_ACTIVATION_CONTEXT } from "../constants";
import { DendronWorkspace } from "../workspace";
import { WorkspaceInitializer } from "./workspaceInitializer";
import * as vscode from "vscode";

/**
 * Seed Browser Workspace Initializer - Open the Seed Browser
 */
export class SeedBrowserInitializer implements WorkspaceInitializer {
  /**
   * No-op
   */
  createVaults(_vault?: DVault): DVault[] {
    return [];
  }

  /**
   * No-op
   */
  async onWorkspaceCreation(_opts: {
    vaults: DVault[];
    wsRoot: string;
    svc?: WorkspaceService;
  }): Promise<void> {
    return;
  }

  /**
   * Launch Seed Browser Webview
   * @param opts
   */
  async onWorkspaceOpen(opts: { ws: DendronWorkspace }): Promise<void> {
    const cmd = new SeedBrowseCommand();
    await cmd.execute();

    await opts.ws.updateGlobalState(
      GLOBAL_STATE.WORKSPACE_ACTIVATION_CONTEXT,
      WORKSPACE_ACTIVATION_CONTEXT.NORMAL.toString()
    );

    vscode.window.showInformationMessage("Seeds Updated");
  }
}
