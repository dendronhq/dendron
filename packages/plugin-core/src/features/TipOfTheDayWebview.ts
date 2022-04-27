import { VSCodeEvents } from "@dendronhq/common-all";
import _md from "markdown-it";
import * as vscode from "vscode";
import {
  DisplayLocation,
  FeatureShowcaseUserResponse,
  IFeatureShowcaseMessage,
} from "../showcase/IFeatureShowcaseMessage";
import { AnalyticsUtils } from "../utils/analytics";

/**
 * Side Panel webview that shows the tip of the day
 * TODO: Add functionality
 *  - let user rotate tips
 *  - save which tip they're on. (right now it just shows the first one.)
 */
export default class TipOfTheDayWebview implements vscode.WebviewViewProvider {
  private _webview: vscode.WebviewView | undefined;
  private _tips: IFeatureShowcaseMessage[];
  private _curTipIndex = 0;

  private BUTTON_CLICKED_MSG = "buttonClicked";
  private TIP_SHOWN_MSG = "loaded";

  private get _currentTip(): IFeatureShowcaseMessage {
    return this._tips[this._curTipIndex];
  }

  /**
   * The set of tips to show the user.
   * @param tips
   */
  constructor(tips: IFeatureShowcaseMessage[]) {
    this._tips = tips;
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext<unknown>,
    _token: vscode.CancellationToken
  ): void {
    this._webview = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      enableCommandUris: true,
    };

    webviewView.webview.html = this.getContent(this._currentTip);

    webviewView.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case this.TIP_SHOWN_MSG:
            AnalyticsUtils.track(VSCodeEvents.FeatureShowcaseDisplayed, {
              messageType: message.showcaseEntry,
              displayLocation: DisplayLocation.TipOfTheDayView,
            });
            return;

          case this.BUTTON_CLICKED_MSG: {
            AnalyticsUtils.track(VSCodeEvents.FeatureShowcaseResponded, {
              messageType: message.showcaseEntry,
              displayLocation: DisplayLocation.TipOfTheDayView,
              userResponse: FeatureShowcaseUserResponse.confirmed,
            });

            const onConfirmCmd = this._currentTip.onConfirm;
            if (onConfirmCmd) vscode.commands.executeCommand(onConfirmCmd);
            return;
          }
          default:
            break;
        }
      },
      undefined,
      undefined
    );

    this.showNextTip();
  }

  private showNextTip(): boolean {
    this._curTipIndex = (this._curTipIndex + 1) % this._tips.length;

    if (this._webview && this._webview.visible) {
      this._webview.webview.html = this.getContent(
        this._tips[this._curTipIndex]
      );

      // Rotate the tip every 10 seconds (for debugging purposes)
      // TODO: Extend this duration to rotate once a day.
      setTimeout(() => this.showNextTip(), 10000);

      return true;
    } else {
      return false;
    }
  }

  /**
   * TODO: add some functionality to allow users to show a new time / prev tip.
   */
  // private prevTip(): void {
  //   this._curTipIndex -= 1;

  //   if (this._curTipIndex < 0) {
  //     this._curTipIndex = this._tips.length - 1;
  //   }
  // }

  private getContent(tip: IFeatureShowcaseMessage) {
    const message = tip.getDisplayMessage(DisplayLocation.TipOfTheDayView);

    let buttonDiv;
    if (tip.onConfirm && tip.confirmText) {
      buttonDiv = `
    <div>
      <button id="btn_id">${tip.confirmText}</button>
    </div>
    `;
    } else {
      buttonDiv = "<div/>";
    }

    const html = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>"Tip of the Day"</title>
        <style>
        p {
          color: var(--vscode-foreground);
        }
        button {
          box-sizing: border-box;
          display: flex;
          width: 100%;
          padding: 4px;
          text-align: center;
          cursor: pointer;
          justify-content: center;
          align-items: center;
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none
      }
      button:hover {
        background-color: var(--vscode-button-hoverBackground);
      }
        </style>
      </head>
      <body>
      <div>
        <p>
          ${message}
        </p>
      </div>
      ${buttonDiv}
  
      <script>
      var btn = document.getElementById("btn_id");
      const vscode = acquireVsCodeApi();
      vscode.postMessage({
          command: "${this.TIP_SHOWN_MSG}",
        });
  
      btn.addEventListener("click", function () {
        vscode.postMessage({
          command: "${this.BUTTON_CLICKED_MSG}",
        });
      });
    </script>
  
      </body>
    </html>
    `;

    return html;
  }
}
