import { DWorkspaceV2 } from "@dendronhq/common-all";
import {
  MetadataService,
  WorkspaceActivationContext,
} from "@dendronhq/engine-server";
import * as vscode from "vscode";
import {
  SeedBrowseCommand,
  WebViewPanelFactory,
} from "../commands/SeedBrowseCommand";
import { getExtension } from "../workspace";
import { WorkspaceInitializer } from "./workspaceInitializer";

/**
 * Seed Browser Workspace Initializer - Open the Seed Browser
 */
export class SeedBrowserInitializer implements WorkspaceInitializer {
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

    MetadataService.instance().setActivationContext(
      WorkspaceActivationContext.normal
    );

    vscode.window.showInformationMessage("Seeds Updated");
  }
}
