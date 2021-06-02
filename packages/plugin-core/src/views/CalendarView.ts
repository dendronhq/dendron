import {
  DendronCalendarViewKey,
  CalendarViewMessage,
  CalendarViewMessageType,
  DMessage,
} from "@dendronhq/common-all";
import * as vscode from "vscode";
import { WebViewUtils } from "./utils";
import { getEngine } from "../workspace";
import { GotoNoteCommand } from "../commands/GotoNote";

export class CalendarView implements vscode.WebviewViewProvider {
  public static readonly viewType = DendronCalendarViewKey.CALENDAR_VIEW;
  private _view?: vscode.WebviewView;

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
    webviewView.webview.onDidReceiveMessage(
      async (msg: CalendarViewMessage) => {
        switch (msg.type) {
          case CalendarViewMessageType.onSelect: {
            const note = getEngine().notes[msg.data.id];
            await new GotoNoteCommand().execute({
              qs: note.fname,
              vault: note.vault,
            });
            break;
          }
          default:
            console.log("got data", msg);
            break;
        }
      }
    );
  }

  private _getHtmlForWebview(_webview: vscode.Webview) {
    return WebViewUtils.genHTMLForView({
      title: "Calendar View",
      view: DendronCalendarViewKey.CALENDAR_VIEW,
    });
  }
}
