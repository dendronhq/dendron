import { DVault, DWorkspaceV2 } from "@dendronhq/common-all";
import { WorkspaceService } from "@dendronhq/engine-server";
import { WORKSPACE_ACTIVATION_CONTEXT } from "../constants";
import { StateService } from "../services/stateService";
import { BlankInitializer } from "./blankInitializer";
import { SeedBrowserInitializer } from "./seedBrowserInitializer";
import { TutorialInitializer } from "./tutorialInitializer";

/**
 * Type that can execute custom code as part of workspace creation and opening of a workspace.
 */
export type WorkspaceInitializer = {
  /**
   * Create the vaults to be added to the workspace being initialized.
   */
  createVaults(vault?: DVault): DVault[];

  /**
   * Invoked after workspace has been created. Perform operations such as copying over notes.
   */
  onWorkspaceCreation?(opts: {
    vaults: DVault[];
    wsRoot: string;
    svc?: WorkspaceService;
  }): Promise<void>;

  /**
   * Invoked after the workspace has been opened. Perform any operations such as re-arranging the layout.
   */
  onWorkspaceOpen?(opts: { ws: DWorkspaceV2 }): Promise<void>;
};

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
