import { WORKSPACE_ACTIVATION_CONTEXT } from "../constants";
import { StateService } from "../services/stateService";
import { BlankInitializer } from "./blankInitializer";
import { SeedBrowserInitializer } from "./seedBrowserInitializer";
import { TutorialInitializer } from "./tutorialInitializer";
import { WorkspaceInitializer } from "./workspaceInitializer";

/**
 * Factory class for creating WorkspaceInitializer types
 */
export class WorkspaceInitFactory {
  static create(): WorkspaceInitializer | undefined {
    switch (StateService.instance().getActivationContext()) {
      case WORKSPACE_ACTIVATION_CONTEXT.TUTORIAL:
        return new TutorialInitializer();

      case WORKSPACE_ACTIVATION_CONTEXT.SEED_BROWSER:
        return new SeedBrowserInitializer();

      default:
        return new BlankInitializer();
    }
  }
}
