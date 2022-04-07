import { VSCodeEvents } from "@dendronhq/common-all";
import vscode from "vscode";
import { AnalyticsUtils } from "../utils/analytics";
import { WebViewUtils } from "./utils";

const UPGRADE_VIEW_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>"Release Notes"</title>
  <style>
    html, body, iframe {
      margin: 0;
      padding: 0;
      border: 0;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <iframe id="iframeView" src="https://wiki.dendron.so/notes/9bc92432-a24c-492b-b831-4d5378c1692b/"></iframe>
</body>

</html>`;

export function showUpgradeView() {
  const panel = vscode.window.createWebviewPanel(
    "releaseNotes",
    "Release Notes",
    vscode.ViewColumn.One,
    {}
  );

  panel.webview.html = UPGRADE_VIEW_HTML;

  WebViewUtils.openWebviewAndMeasureTimeOpen(panel, (duration) => {
    AnalyticsUtils.track(VSCodeEvents.UpgradeViewClosed, {
      timeOpen: duration,
    });
  });
}
