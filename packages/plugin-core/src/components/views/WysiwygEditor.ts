import {
  ConfigUtils,
  DendronEditorViewKey,
  EditorMessage,
  EditorMessageEnum,
  EditorMessageType,
  getWebEditorViewEntry,
} from "@dendronhq/common-all";
import * as vscode from "vscode";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { WebViewUtils } from "../../views/utils";

export class WysiwygEditor implements vscode.CustomTextEditorProvider {
  private _ext: IDendronExtension;

  constructor({ extension }: { extension: IDendronExtension }) {
    this._ext = extension;
  }

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    const port = this._ext.port!;
    const engine = this._ext.getEngine();
    const { wsRoot } = engine;

    // Setup initial content for the webview
    webviewPanel.webview.options = {
      enableScripts: true,
      enableCommandUris: true,
      localResourceRoots: WebViewUtils.getLocalResourceRoots(
        this._ext.context
      ).concat(vscode.Uri.file(wsRoot)),
    };

    const { bundleName: name } = getWebEditorViewEntry(
      DendronEditorViewKey.WYSIWYG_EDITOR
    );

    const webViewAssets = WebViewUtils.getJsAndCss();
    const initialTheme =
      ConfigUtils.getPreview(this._ext.getDWorkspace().config).theme || "";

    this.setupCallbacks(webviewPanel.webview, document);

    const html = await WebViewUtils.getWebviewContent({
      ...webViewAssets,
      name,
      port,
      wsRoot,
      panel: webviewPanel,
      initialTheme,
    });

    webviewPanel.webview.html = html;
  }

  private setupCallbacks(
    webview: vscode.Webview,
    document: vscode.TextDocument
  ): void {
    // Callback on getting a message back from the webview
    webview.onDidReceiveMessage(async (msg: EditorMessage) => {
      const ctx = "ShowPreview:onDidReceiveMessage";
      switch (msg.type) {
        case EditorMessageEnum.documentChanged: {
          const zeroIndexedLineNumber = msg.data.lineNumber - 1;
          console.log(
            `Msg Received: 0 Indexed Line: ${zeroIndexedLineNumber} | Text: ${msg.data.text} | EditType: ${msg.data.editType}`
          );

          const edit = new vscode.WorkspaceEdit();

          // Just replace the entire document every time for this example extension.
          // A more complete extension should compute minimal edits instead.

          if (msg.data.editType === "insertion") {
            if (zeroIndexedLineNumber >= document.lineCount) {
              console.log(`Doing Insert`);
              edit.insert(
                document.uri,
                new vscode.Position(zeroIndexedLineNumber, 0),
                "\n" + msg.data.text
              );
            } else {
              console.log(
                `Doing Replace. Existing Line: ${
                  document.lineAt(zeroIndexedLineNumber).text
                }`
              );
              edit.replace(
                document.uri,
                new vscode.Range(
                  zeroIndexedLineNumber,
                  0,
                  zeroIndexedLineNumber,
                  document.lineAt(zeroIndexedLineNumber).text.length
                ),
                msg.data.text
              );
            }
          } else {
            console.log(
              `Doing Delete on line ${zeroIndexedLineNumber}. Existing Line: ${
                document.lineAt(zeroIndexedLineNumber).text
              }`
            );

            if (zeroIndexedLineNumber > 0) {
              edit.delete(
                document.uri,
                new vscode.Range(
                  zeroIndexedLineNumber - 1,
                  document.lineAt(zeroIndexedLineNumber - 1).text.length,
                  zeroIndexedLineNumber,
                  0
                  // document.lineAt(zeroIndexedLineNumber).text.length
                )
              );
            } else {
              // we're trying to delete line 0
              edit.delete(document.uri, new vscode.Range(0, 0, 1, 0));
            }
          }

          await vscode.workspace.applyEdit(edit);

          break;
        }
        default:
          break;
        // console.log("Unknown Message Received");
      }
    });
  }
}
