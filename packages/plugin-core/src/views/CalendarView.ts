import { DendronTreeViewKey, DMessage } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { getWS } from "../workspace";
// import { WebViewUtils } from "./utils";

export class CalendarView implements vscode.WebviewViewProvider {
  public static readonly viewType = DendronTreeViewKey.CALENDAR_VIEW;
  private _view?: vscode.WebviewView;

  constructor() {
    getWS().setTreeView(DendronTreeViewKey.SAMPLE_VIEW, this);
  }

  public postMessage(msg: DMessage) {
    this._view?.webview.postMessage(msg);
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [],
    };
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
  }

  private _getHtmlForWebview(_webview: vscode.Webview) {
    // return WebViewUtils.genHTMLForTreeView({
    //   title: "Calendar View",
    //   view: DendronTreeViewKey.CALENDAR_VIEW,
    // });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Calendar View</title>
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
  This is the body of calendar view
</body>

</html>`;
  }
}
