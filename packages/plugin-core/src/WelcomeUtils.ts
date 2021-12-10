import { TutorialEvents } from "@dendronhq/common-all";
import { readMD, resolveTilde } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { SetupWorkspaceCommand } from "./commands/SetupWorkspace";
import { AnalyticsUtils } from "./utils/analytics";
import { VSCodeUtils } from "./vsCodeUtils";
import { TutorialInitializer } from "./workspace/tutorialInitializer";

export function showWelcome(assetUri: vscode.Uri) {
  try {
    // NOTE: this needs to be from extension because no workspace might exist at this point
    const uri = VSCodeUtils.joinPath(
      assetUri,
      "dendron-ws",
      "vault",
      "welcome.html"
    );

    const { content } = readMD(uri.fsPath);
    const title = "Welcome to Dendron";

    const panel = vscode.window.createWebviewPanel(
      _.kebabCase(title),
      title,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );
    panel.webview.html = content;

    panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "loaded":
            AnalyticsUtils.track(TutorialEvents.WelcomeShow);
            return;

          case "initializeWorkspace": {
            // Try to put into a Default '~/Dendron' folder first. Only prompt
            // if that path and the backup path already exist to lower
            // onboarding friction
            let wsPath;
            const wsPathPrimary = path.join(resolveTilde("~"), "Dendron");
            const wsPathBackup = path.join(
              resolveTilde("~"),
              "Dendron-Tutorial"
            );

            if (!fs.pathExistsSync(wsPathPrimary)) {
              wsPath = wsPathPrimary;
            } else if (!fs.pathExistsSync(wsPathBackup)) {
              wsPath = wsPathBackup;
            } else {
              wsPath = await VSCodeUtils.gatherFolderPath({
                default: path.join(resolveTilde("~"), "Dendron"),
                override: {
                  title: "Path for new Dendron Code Workspace",
                },
              });
            }

            // User didn't pick a path, abort
            if (!wsPath) {
              return;
            }

            await new SetupWorkspaceCommand().execute({
              rootDirRaw: wsPath,
              workspaceInitializer: new TutorialInitializer(),
            });

            return;
          }
          default:
            break;
        }
      },
      undefined,
      undefined
    );
  } catch (err) {
    vscode.window.showErrorMessage(JSON.stringify(err));
  }
}
