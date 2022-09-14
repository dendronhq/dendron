import {
  TutorialEvents,
  VideoTutorialTestGroups,
  _2022_09_VIDEO_TUTORIAL_TEST,
} from "@dendronhq/common-all";
import { readMD, SegmentClient } from "@dendronhq/common-server";
import _ from "lodash";
import * as vscode from "vscode";
import { LaunchTutorialWorkspaceCommand } from "./commands/LaunchTutorialWorkspaceCommand";
import { LaunchTutorialCommandInvocationPoint } from "./constants";
import { AnalyticsUtils } from "./utils/analytics";
import { VSCodeUtils } from "./vsCodeUtils";

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
    let content: string;
    const title = "Welcome to Dendron";

    const panel = vscode.window.createWebviewPanel(
      _.kebabCase(title),
      title,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    const ABUserGroup = _2022_09_VIDEO_TUTORIAL_TEST.getUserGroup(
      SegmentClient.instance().anonymousId
    );
    let testgroup: string;
    const version = Number(vscode.version.substring(0, 4)); // version: x.xx.x
    if (ABUserGroup === VideoTutorialTestGroups.video && version > 1.71) {
      const videoUri = VSCodeUtils.joinPath(
        assetUri,
        "dendron-ws",
        "vault",
        "media",
        "video.webm"
      );
      const videoUrl = panel.webview.asWebviewUri(videoUri).toString();
      content = getWelcomeContentWithVideo(videoUrl);
      testgroup = VideoTutorialTestGroups.video;
    } else {
      // NOTE: this needs to be from extension because no workspace might exist at this point
      const uri = VSCodeUtils.joinPath(
        assetUri,
        "dendron-ws",
        "vault",
        "welcome.html"
      );
      content = readMD(uri.fsPath).content;
      testgroup = VideoTutorialTestGroups.gif;
    }

    panel.webview.html = content;

    panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "loaded":
            AnalyticsUtils.track(TutorialEvents.WelcomeShow, { testgroup });
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

export function getWelcomeContentWithVideo(videoUrl: string) {
  return `<!DOCTYPE html>
  <html lang="en">
    <style>
      * {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      h1 {
        text-align: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        margin-bottom: 0px;
        margin-top: 0px;
        padding-right: 20px;
      }
      .container{
        text-align: center;
      }
      .subtitle {
        margin-top: 12px;
      }
      #btn_container {
        padding-top: 20px;
        padding-bottom: 50px;
      }
      .initialize_btn {
        border-radius: 2px;
        background-color: rgb(0, 168, 36);
        border: none;
        color: #FFFFFF;
        text-align: center;
        font-size: 22px;
        padding: 8px;
        width: 220px;
        transition: all 0.4s;
        cursor: pointer;
        margin: 25px;
      }
      .initialize_btn span {
        cursor: pointer;
        display: inline-block;
        position: relative;
        transition: 0.4s;
      }
      .initialize_btn span:after {
        content: '\\00bb';
        position: absolute;
        opacity: 0;
        top: 0;
        right: -20px;
        transition: 0.5s;
      }
      .initialize_btn:hover {
        background-color: rgb(2, 95, 22);
        color: #FFFFFF;
      }
      .initialize_btn:hover span {
        padding-right: 25px;
      }
      .initialize_btn:hover span:after {
        opacity: 1;
        right: 0;
      }
      #btn_subtext {
        margin-top: 20px;
      }
      #gif-ctn {
        text-align: center;
      }
      #usage-gif {
        width: 100%;
        max-width: 1200px;
        vertical-align: middle;
      }
      #header-block {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .inline-header {
        display: inline-block;
      }
    </style>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Dendron</title>
    </head>
    <body>
      <div class="container">
        <div id="header-block">
          <img class="inline-header" width="100" src="https://org-dendron-public-assets.s3.amazonaws.com/images/tutorial-logo.png">
          <div class="inline-header">
            <h1>Welcome to Dendron</h1>
          </div>
        </div>
      <h2>
        Knowledge Management. Redefined.
      </h2>
      <p class="subtitle">Note, organize, and reference any amount of information.</p>
    </div>
      <br>
      <div id="btn_container" class="container">
        <a class="initialize_btn" id="btn_id" target="_blank" rel="nofollow"><span>Get Started</a>
      </div>
      
      <div id="gif-ctn">
    <video controls autoplay>
      <source src=${videoUrl} type="video/webm">
    </video>
      </div>

      <script>
        var btn = document.getElementById("btn_id");
        const vscode = acquireVsCodeApi();
        vscode.postMessage({
            command: "loaded",
          });

        btn.addEventListener("click", function () {
          vscode.postMessage({
            command: "initializeWorkspace",
          });
        });
      </script>
    </body>
  </html>
  `;
}
