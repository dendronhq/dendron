import { BlankInitializer } from "./blankInitializer";
import {
  OnWorkspaceCreationOpts,
  WorkspaceInitializer,
} from "./workspaceInitializer";

/**
 * Template Workspace Initializer - add the templates seed to the workspace:
 */
export class TemplateInitializer
  extends BlankInitializer
  implements WorkspaceInitializer
{
  async onWorkspaceCreation(opts: OnWorkspaceCreationOpts): Promise<void> {
    await super.onWorkspaceCreation(opts);

    await opts.svc?.seedService.addSeed({
      id: "dendron.templates",
    });

    return;
  }
}
