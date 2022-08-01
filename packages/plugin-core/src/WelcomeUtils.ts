import {
  QuickstartTutorialTestGroups,
  TutorialEvents,
} from "@dendronhq/common-all";
import { readMD } from "@dendronhq/common-server";
import _ from "lodash";
import * as vscode from "vscode";
import { LaunchTutorialWorkspaceCommand } from "./commands/LaunchTutorialWorkspaceCommand";
import { LaunchTutorialCommandInvocationPoint } from "./constants";
import { AnalyticsUtils } from "./utils/analytics";
import { VSCodeUtils } from "./vsCodeUtils";
import { TutorialInitializer } from "./workspace/tutorialInitializer";

async function initWorkspace() {
  // ^z5hpzc3fdkxs
  await AnalyticsUtils.trackForNextRun(TutorialEvents.ClickStart);

  await new LaunchTutorialWorkspaceCommand().run({
    invocationPoint: LaunchTutorialCommandInvocationPoint.WelcomeWebview,
  });
  return;
}

export function showWelcome(assetUri: vscode.Uri) {
  try {
    // NOTE: this needs to be from extension because no workspace might exist at this point
    const uri = VSCodeUtils.joinPath(
      assetUri,
      "dendron-ws",
      "vault",
      "welcome.html"
    );
    const group = TutorialInitializer.getTutorialType();

    if (group === QuickstartTutorialTestGroups["quickstart-skip-welcome"]) {
      return initWorkspace();
    }

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
            // ^z5hpzc3fdkxs
            await initWorkspace();
            return;
          }
          default:
            break;
        }
      },
      undefined,
      undefined
    );
    return;
  } catch (err) {
    vscode.window.showErrorMessage(JSON.stringify(err));
    return;
  }
}
