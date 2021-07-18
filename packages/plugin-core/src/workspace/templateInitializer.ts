import { DVault } from "@dendronhq/common-all";
import { WorkspaceService } from "@dendronhq/engine-server";
import { BlankInitializer } from "./blankInitializer";
import { WorkspaceInitializer } from "./workspaceInitializer";

/**
 * Template Workspace Initializer - add the templates seed to the workspace:
 */
export class TemplateInitializer
  extends BlankInitializer
  implements WorkspaceInitializer
{
  async onWorkspaceCreation(opts: {
    vaults: DVault[];
    wsRoot: string;
    svc?: WorkspaceService;
  }): Promise<void> {
    await super.onWorkspaceCreation(opts);

    await opts.svc?.seedService.addSeed({
      id: "dendron.templates",
    });

    return;
  }
}
