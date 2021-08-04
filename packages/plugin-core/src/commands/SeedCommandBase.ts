import { DendronError, ERROR_SEVERITY } from "@dendronhq/common-all";
import { SeedService } from "@dendronhq/engine-server";
import { getWS } from "../workspace";
import { BasicCommand } from "./base";

export abstract class SeedCommandBase<
  CommandOpts,
  CommandOutput
> extends BasicCommand<CommandOpts, CommandOutput> {
  protected seedSvc: SeedService | undefined = undefined;

  public constructor();
  public constructor(seedSvc: SeedService);
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
      const ws = getWS().workspaceService;
      if (!ws) {
        throw new DendronError({
          message: `workspace service unavailable`,
          severity: ERROR_SEVERITY.MINOR,
        });
      } else {
        this.seedSvc = ws.seedService;
      }
    }

    return this.seedSvc;
  }
}
