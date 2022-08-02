import { DVault, DWorkspaceV2 } from "@dendronhq/common-all";
import { WorkspaceService } from "@dendronhq/engine-server";

export type OnWorkspaceCreationOpts = {
  wsVault?: DVault;
  additionalVaults?: DVault[];
  wsRoot: string;
  svc?: WorkspaceService;
};

/**
 * Type that can execute custom code as part of workspace creation and opening of a workspace.
 */
export type WorkspaceInitializer = {
  /**
   * Create the vaults to be added to the workspace being initialized.
   */
  createVaults?(wsVault?: DVault): { wsVault?: DVault; additionalVaults?: [] };

  /**
   * Invoked after workspace has been created. Perform operations such as copying over notes.
   */
  onWorkspaceCreation?(opts: OnWorkspaceCreationOpts): Promise<void>;

  /**
   * Invoked after the workspace has been opened. Perform any operations such as re-arranging the layout.
   */
  onWorkspaceOpen?(opts: { ws: DWorkspaceV2 }): Promise<void>;

  /**
   * Invoked after the workspace has been activated.
   * @param opts
   */
  onWorkspaceActivate?(opts: {
    skipOpts:
      | Partial<{
          skipTreeView: boolean;
        }>
      | undefined;
  }): Promise<void>;
};
