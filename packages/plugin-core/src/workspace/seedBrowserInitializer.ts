import { DVault, DWorkspaceV2 } from "@dendronhq/common-all";
import { WorkspaceService } from "@dendronhq/engine-server";
import * as vscode from "vscode";
import {
  SeedBrowseCommand,
  WebViewPanelFactory,
} from "../commands/SeedBrowseCommand";
import { WORKSPACE_ACTIVATION_CONTEXT } from "../constants";
import { StateService } from "../services/stateService";
import { getExtension } from "../workspace";
import { WorkspaceInitializer } from "./workspaceInitializer";

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
   * @param _opts
   */
  async onWorkspaceOpen(_opts: { ws: DWorkspaceV2 }): Promise<void> {
    const panel = WebViewPanelFactory.create(
      getExtension().workspaceService!.seedService
    );

    const cmd = new SeedBrowseCommand(panel);
    await cmd.execute();

    StateService.instance().setActivationContext(
      WORKSPACE_ACTIVATION_CONTEXT.NORMAL
    );

    vscode.window.showInformationMessage("Seeds Updated");
  }
}
