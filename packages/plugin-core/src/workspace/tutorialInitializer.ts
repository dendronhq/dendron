import { DendronError, DVault } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import rif from "replace-in-file";
import * as vscode from "vscode";
import { DendronWorkspace } from "../workspace";
import { GLOBAL_STATE, WORKSPACE_ACTIVATION_CONTEXT } from "./../constants";
import { Logger } from "./../logger";
import { VSCodeUtils } from "./../utils";
import { MarkdownUtils } from "./../utils/md";
import { BlankInitializer } from "./blankInitializer";
import { WorkspaceInitializer } from "./workspaceInitializer";

/**
 * Workspace Initializer for the Tutorial Experience. Copies tutorial notes and
 * launches the user into the tutorial layout after the workspace is opened.
 */
export class TutorialInitializer extends BlankInitializer implements WorkspaceInitializer {

  onWorkspaceCreation = async (opts: { vaults: DVault[]; wsRoot: string }) => {
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
  };

  onWorkspaceOpen: (opts: { ws: DendronWorkspace }) => void = async (opts: {
    ws: DendronWorkspace;
  }) => {
    const ctx = "TutorialInitializer.onWorkspaceOpen";

    let rootUri = VSCodeUtils.joinPath(
      opts.ws.rootWorkspace.uri,
      "tutorial.md"
    );

    if (fs.pathExistsSync(rootUri.fsPath)) {
      // Set the view to have the tutorial page showing with the preview opened to the side.
      await vscode.window.showTextDocument(rootUri);
      await MarkdownUtils.openPreview({ reuseWindow: false });
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
  };
}
