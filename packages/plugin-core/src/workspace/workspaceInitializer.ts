import { DVault } from "@dendronhq/common-all";
import { WorkspaceService } from "@dendronhq/engine-server";
import _ from "lodash";
import * as vscode from "vscode";
import { DendronWorkspace } from "../workspace";
import { GLOBAL_STATE, WORKSPACE_ACTIVATION_CONTEXT } from "../constants";
import { BlankInitializer } from "./blankInitializer";
import { TutorialInitializer } from "./tutorialInitializer";

/**
 * Type that can execute custom code as part of workspace creation and opening of a workspace.
 */
export type WorkspaceInitializer = {
  /**
   * Create the vaults to be added to the workspace being initialized.
   */
  createVaults(): DVault[];

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
  onWorkspaceOpen?(opts: { ws: DendronWorkspace }): Promise<void>;
};

/**
 * Factory class for creating WorkspaceInitializer types
 */
export class WorkspaceInitFactory {
  static create(ws: DendronWorkspace): WorkspaceInitializer | undefined {
    if (this.isTutorialWorkspaceLaunch(ws.context)) {
      return new TutorialInitializer();
    }

    return new BlankInitializer();
  }

  private static isTutorialWorkspaceLaunch(
    context: vscode.ExtensionContext
  ): boolean {
    const state = context.globalState.get<string | undefined>(
      GLOBAL_STATE.WORKSPACE_ACTIVATION_CONTEXT
    );
    return (
      _.isUndefined(state) ||
      state === WORKSPACE_ACTIVATION_CONTEXT.TUTORIAL.toString()
    );
  }
}
