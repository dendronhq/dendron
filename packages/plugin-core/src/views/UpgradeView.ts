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

/**
 * This was an attempt at a webview that displays the changelog.
 *
 * There are a few known issues with this view:
 * - It displays the entire changelog page, which includes the entire history
 *   and not just what was changed
 * - It's hard to collect any telemetry from the view because of VSCode/iframe
 *   security policies
 * - The displayed page doesn't function properly because VSCode disables
 *   javascript inside of it
 * - Clicking any link inside the view opens that page inside the view as well,
 *   rather than opening it with the default browser
 *
 * As a result, we decided to not roll out this view. If we ever decide to
 * reintroduce this, consider the bugs above.
 *
 * */
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
