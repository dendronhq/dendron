import { DendronError, ERROR_SEVERITY } from "@dendronhq/common-all";
import {
  MetadataService,
  SeedService,
  WorkspaceActivationContext,
} from "@dendronhq/engine-server";
import { commands } from "vscode";
import { getExtension } from "../workspace";
import { BasicCommand } from "./base";

export abstract class SeedCommandBase<
  CommandOpts,
  CommandOutput
> extends BasicCommand<CommandOpts, CommandOutput> {
  protected seedSvc: SeedService | undefined = undefined;

  public constructor(seedSvc?: SeedService) {
    super();

    if (seedSvc !== undefined) {
      this.seedSvc = seedSvc;
    }
  }

  // Have lazy initialization on SeedService if it's not explicitly set in the
  // constructor. Ideally, SeedService should be set as a readonly prop in the
  // constructor, but right now the workspace from getWS() isn't set up by the
  // time the commands are constructed in the initialization lifecycle.
  protected getSeedSvc(): SeedService {
    if (!this.seedSvc) {
      const wsService = getExtension().workspaceService;
      if (!wsService) {
        throw new DendronError({
          message: `workspace service unavailable`,
          severity: ERROR_SEVERITY.MINOR,
        });
      } else {
        this.seedSvc = wsService.seedService;
      }
    }

    return this.seedSvc;
  }

  protected async onUpdatingWorkspace() {
    MetadataService.instance().setActivationContext(
      WorkspaceActivationContext.seedBrowser
    );
  }

  protected async onUpdatedWorkspace() {
    await commands.executeCommand("workbench.action.reloadWindow");
  }
}
