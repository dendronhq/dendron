import {
  DendronError,
  DVault,
  DWorkspaceV2,
  getStage,
  TutorialEvents,
  VaultUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import fs from "fs-extra";
import path from "path";
import rif from "replace-in-file";
import * as vscode from "vscode";
import { WORKSPACE_ACTIVATION_CONTEXT } from "../constants";
import { Logger } from "../logger";
import { StateService } from "../services/stateService";
import { VSCodeUtils } from "../utils";
import { AnalyticsUtils } from "../utils/analytics";
import { MarkdownUtils } from "../utils/md";
import { getDWorkspace, getExtension } from "../workspace";
import { BlankInitializer } from "./blankInitializer";
import { WorkspaceInitializer } from "./workspaceInitializer";

/**
 * Workspace Initializer for the Tutorial Experience. Copies tutorial notes and
 * launches the user into the tutorial layout after the workspace is opened.
 */
export class TutorialInitializer
  extends BlankInitializer
  implements WorkspaceInitializer
{
  async onWorkspaceCreation(opts: {
    vaults: DVault[];
    wsRoot: string;
  }): Promise<void> {
    const ctx = "TutorialInitializer.onWorkspaceCreation";
    super.onWorkspaceCreation(opts);

    StateService.instance().setActivationContext(
      WORKSPACE_ACTIVATION_CONTEXT.TUTORIAL
    );

    const dendronWSTemplate = VSCodeUtils.joinPath(
      getDWorkspace().assetUri,
      "dendron-ws"
    );

    const vpath = vault2Path({ vault: opts.vaults[0], wsRoot: opts.wsRoot });

    fs.copySync(path.join(dendronWSTemplate.fsPath, "tutorial"), vpath);

    // Tailor the tutorial text to the particular OS and for their workspace location.
    const options = {
      files: [path.join(vpath, "*.md")],

      from: [/%KEYBINDING%/g, /%WORKSPACE_ROOT%/g],
      to: [
        process.platform === "darwin" ? "Cmd" : "Ctrl",
        path.join(opts.wsRoot, "dendron.code-workspace"),
      ],
    };

    rif.replaceInFile(options).catch((err: Error) => {
      Logger.error({
        ctx,
        error: DendronError.createPlainError({
          error: err,
          message: "error replacing tutorial placeholder text",
        }),
      });
    });
  }

  async onWorkspaceOpen(opts: { ws: DWorkspaceV2 }): Promise<void> {
    const ctx = "TutorialInitializer.onWorkspaceOpen";

    const { wsRoot, vaults } = opts.ws;
    const vaultRelPath = VaultUtils.getRelPath(vaults[0]);
    const rootUri = vscode.Uri.file(
      path.join(wsRoot, vaultRelPath, "tutorial.md")
    );
    if (fs.pathExistsSync(rootUri.fsPath)) {
      // Set the view to have the tutorial page showing with the preview opened to the side.
      await vscode.window.showTextDocument(rootUri);
      if (getStage() !== "test") {
        // TODO: HACK to wait for existing preview to be ready
        setTimeout(() => {
          MarkdownUtils.openPreview();
        }, 1000);
      }
    } else {
      Logger.error({
        ctx,
        error: new DendronError({ message: `Unable to find tutorial.md` }),
      });
    }

    StateService.instance().setActivationContext(
      WORKSPACE_ACTIVATION_CONTEXT.NORMAL
    );

    // Register a special analytics handler for the tutorial:
    const extension = getExtension();
    if (extension.windowWatcher) {
      extension.windowWatcher.registerActiveTextEditorChangedHandler((e) => {
        const fileName = e?.document.uri.fsPath;

        let eventName: TutorialEvents | undefined;

        if (fileName?.endsWith("tutorial.md")) {
          eventName = TutorialEvents.Tutorial_0_Show;
        } else if (fileName?.endsWith("tutorial.1-navigation-basics.md")) {
          eventName = TutorialEvents.Tutorial_1_Show;
        } else if (fileName?.endsWith("tutorial.2-taking-notes.md")) {
          eventName = TutorialEvents.Tutorial_2_Show;
        } else if (fileName?.endsWith("tutorial.3-linking-your-notes.md")) {
          eventName = TutorialEvents.Tutorial_3_Show;
        } else if (fileName?.endsWith("tutorial.4-rich-formatting.md")) {
          eventName = TutorialEvents.Tutorial_4_Show;
        } else if (fileName?.endsWith("tutorial.5-conclusion.md")) {
          eventName = TutorialEvents.Tutorial_5_Show;
        }

        if (eventName) {
          AnalyticsUtils.track(eventName);
        }
      });
    }
  }
}
