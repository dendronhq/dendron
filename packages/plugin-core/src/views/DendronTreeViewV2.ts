import * as vscode from "vscode";

export class DendronTreeViewV2 implements vscode.WebviewViewProvider {
  public static readonly viewType = "dendron.treeViewV2";

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

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

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        default:
          console.log("got data", data);
          break;
      }
    });
  }

  public addColor() {
    if (this._view) {
      this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
      this._view.webview.postMessage({ type: "addColor" });
    }
  }

  private _getHtmlForWebview(_webview: vscode.Webview) {
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
  <iframe src="http://75c072eb44fc.ngrok.io/vscode/tree-view?port=3001&ws=%2FUsers%2Fkevinlin%2Fprojects%2Fdendronv2%2Foneoffs%2Faws-yc-user-manual"></iframe>

  <script>
    const vscode = acquireVsCodeApi();

    window.addEventListener("message", (e) => {
      if (e.data.type && e.data.type === 'portal') {
        const data = e.data.data;
        console.log("got portal event", data)
        vscode.postMessage({
          type: 'bond',
          data,
        })
        return;
      } else {
        window.dispatchEvent(new KeyboardEvent('keydown', JSON.parse(e.data)));
      }
    }, false);
  </script>

</body>

</html>`;
  }
}
