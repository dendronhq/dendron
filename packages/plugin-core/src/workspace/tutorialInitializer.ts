import {
  DendronError,
  DVault,
  getStage,
  TutorialEvents,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import fs from "fs-extra";
import path from "path";
import rif from "replace-in-file";
import * as vscode from "vscode";
import { AnalyticsUtils } from "../utils/analytics";
import { DendronWorkspace } from "../workspace";
import { GLOBAL_STATE, WORKSPACE_ACTIVATION_CONTEXT } from "../constants";
import { Logger } from "../logger";
import { VSCodeUtils } from "../utils";
import { MarkdownUtils } from "../utils/md";
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

    const ws = DendronWorkspace.instance();

    await ws.updateGlobalState(
      GLOBAL_STATE.WORKSPACE_ACTIVATION_CONTEXT,
      WORKSPACE_ACTIVATION_CONTEXT.TUTORIAL.toString()
    );

    const dendronWSTemplate = VSCodeUtils.joinPath(
      ws.extensionAssetsDir,
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

  async onWorkspaceOpen(opts: { ws: DendronWorkspace }): Promise<void> {
    const ctx = "TutorialInitializer.onWorkspaceOpen";

    const rootUri = VSCodeUtils.joinPath(
      opts.ws.rootWorkspace.uri,
      "tutorial.md"
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

    await opts.ws.updateGlobalState(
      GLOBAL_STATE.WORKSPACE_ACTIVATION_CONTEXT,
      WORKSPACE_ACTIVATION_CONTEXT.NORMAL
    );

    // Register a special analytics handler for the tutorial:
    if (opts.ws.windowWatcher) {
      opts.ws.windowWatcher.registerActiveTextEditorChangedHandler((e) => {
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
