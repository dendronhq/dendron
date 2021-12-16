import { DendronTreeViewKey, DMessage } from "@dendronhq/common-all";
import * as vscode from "vscode";
import { WebViewUtils } from "./utils";

export class LookupView implements vscode.WebviewViewProvider {
  public static readonly viewType = DendronTreeViewKey.LOOKUP_VIEW;
  private _view?: vscode.WebviewView;

  public postMessage(msg: DMessage) {
    this._view?.webview.postMessage(msg);
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext<unknown>,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [],
    };
    webviewView.webview.html = await this._getHtmlForWebview(
      webviewView.webview
    );
  }

  private _getHtmlForWebview(_webview: vscode.Webview) {
    return WebViewUtils.genHTMLForTreeView({
      title: "LookupView",
      view: DendronTreeViewKey.LOOKUP_VIEW,
    });
  }
}
