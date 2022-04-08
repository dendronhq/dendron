import { Time, TutorialEvents, WorkspaceType } from "@dendronhq/common-all";
import { FileUtils, readMD, resolveTilde } from "@dendronhq/common-server";
import { MetadataService } from "@dendronhq/engine-server";
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
            // ^z5hpzc3fdkxs
            // it takes up to 8s to do a synchronous track call which becomes noticable to the user
            // instead of doing that, we write the timestamp when the welcome was clicked and async track it during initialization
            MetadataService.instance().setMeta(
              "welcomeClicked",
              Time.now().toMillis()
            );
            // Try to put into a eefault '~/Dendron' folder first. If path is occupied, create a new folder with an numbered suffix
            const { filePath } =
              FileUtils.genFilePathWithSuffixThatDoesNotExist({
                fpath: path.join(resolveTilde("~"), "Dendron"),
              });

            await new SetupWorkspaceCommand().execute({
              rootDirRaw: filePath,
              workspaceInitializer: new TutorialInitializer(),
              workspaceType: WorkspaceType.CODE,
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
