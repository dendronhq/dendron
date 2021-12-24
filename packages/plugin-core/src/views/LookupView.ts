import {
  DendronTreeViewKey,
  DMessage,
  LookupModifierStatePayload,
  LookupViewMessage,
  LookupViewMessageEnum,
} from "@dendronhq/common-all";
import { Logger } from "../logger";
import * as vscode from "vscode";
import { WebViewUtils } from "./utils";
import { LookupControllerV3 } from "../components/lookup/LookupControllerV3";

export class LookupView implements vscode.WebviewViewProvider {
  public static readonly viewType = DendronTreeViewKey.LOOKUP_VIEW;
  private _view?: vscode.WebviewView;
  private _controller?: LookupControllerV3;

  public postMessage(msg: DMessage) {
    this._view?.webview.postMessage(msg);
  }

  public registerController(controller: LookupControllerV3) {
    this._controller = controller;
  }

  public deregisterController() {
    this._controller = undefined;
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
    webviewView.webview.onDidReceiveMessage(
      this.onDidReceiveMessageHandler,
      this
    );
  }

  async onDidReceiveMessageHandler(msg: LookupViewMessage) {
    const ctx = "onDidReceiveMessage";
    Logger.info({ ctx, data: msg });
    switch (msg.type) {
      case LookupViewMessageEnum.onValuesChange: {
        Logger.info({
          ctx: `${ctx}:onValuesChange`,
          data: msg.data,
        });

        const controllerState = this._controller?.state.buttons.map(
          (button) => {
            return { type: button.type, pressed: button.pressed };
          }
        );
        console.log({ controllerState });

        console.log({ bond: msg.data.allValues });
        break;
      }
      case LookupViewMessageEnum.onUpdate:
      default:
        break;
    }
  }

  public refresh(payload: LookupModifierStatePayload) {
    if (this._view) {
      this._view.webview.postMessage({
        type: LookupViewMessageEnum.onUpdate,
        data: { payload },
        source: "vscode",
      });
    }
  }

  private _getHtmlForWebview(_webview: vscode.Webview) {
    return WebViewUtils.genHTMLForTreeView({
      title: "LookupView",
      view: DendronTreeViewKey.LOOKUP_VIEW,
    });
  }
}
