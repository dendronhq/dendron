import {
  DMessage,
  DMessageSource,
  DUtils,
  NoteProps,
  TreeViewMessage,
  TreeViewMessageType,
} from "@dendronhq/common-all";
import * as vscode from "vscode";
import { GotoNoteCommand } from "../commands/GotoNote";
import { Logger } from "../logger";
import { DendronWorkspace, getEngine, getWS } from "../workspace";

export class DendronTreeViewV2 implements vscode.WebviewViewProvider {
  public static readonly viewType = "dendron.treeViewV2";

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {
    getWS().dendronTreeViewV2 = this;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (msg: TreeViewMessage) => {
      switch (msg.type) {
        case TreeViewMessageType.onSelect: {
          Logger.info({ ctx: "onDidReceiveMessage", data: msg });
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
    });
  }

  public refresh(note: NoteProps) {
    if (this._view) {
      this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
      this._view.webview.postMessage({
        type: "onDidChangeActiveTextEditor",
        data: note,
        source: "vscode",
      } as DMessage);
    }
  }

  private _getHtmlForWebview(_webview: vscode.Webview) {
    const ws = getWS();
    const qs = DUtils.querystring.stringify({
      ws: DendronWorkspace.wsRoot(),
      port: ws.port,
    });
    const src = `${ws.getClientAPIRootUrl()}/vscode/tree-view.html?${qs}`;
    Logger.info({ ctx: "DendronTreeViewV2", src });
    // http://75c072eb44fc.ngrok.io/vscode/tree-view?port=3001&ws=%2FUsers%2Fkevinlin%2Fprojects%2Fdendronv2%2Foneoffs%2Faws-yc-user-manual
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tree View</title>
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
  <iframe id="iframeView" src="${src}"></iframe>

  <script>
    const vscode = acquireVsCodeApi();

    window.addEventListener("message", (e) => {
      console.log("got message", e);
      const message = e.data;
      if (message.type && message.source === '${DMessageSource.webClient}') {
        console.log("got webclient event", message)
        vscode.postMessage(message);
        return;
      } else if (message.source === 'vscode') {
        console.log("got message from vscode", message)
        const iframe = document.getElementById('iframeView');
        iframe.contentWindow.postMessage(message, "*");
      } else  {
        window.dispatchEvent(new KeyboardEvent('keydown', JSON.parse(e.data)));
      }
    }, false);
  </script>

</body>

</html>`;
  }
}
