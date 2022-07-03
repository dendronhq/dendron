import {
  ConfigUtils,
  DendronEditorViewKey,
  DMessageEnum,
  DMessageSource,
  EditorChangeMessage,
  EditorInitMessage,
  EditorMessageEnum,
  EditorMessageType,
  getWebEditorViewEntry,
  OnDidChangeActiveTextEditorMsg,
} from "@dendronhq/common-all";
import _ from "lodash";
import * as vscode from "vscode";
import { IDendronExtension } from "../../dendronExtensionInterface";
import {
  ITextDocumentService,
  TextDocumentService,
} from "../../services/TextDocumentService";
import { TextDocumentServiceFactory } from "../../services/TextDocumentServiceFactory";
import { WebViewUtils } from "../../views/utils";

export class WysiwygEditor implements vscode.CustomTextEditorProvider {
  private _ext: IDendronExtension;
  _textDocumentService: ITextDocumentService;

  constructor({ extension }: { extension: IDendronExtension }) {
    this._ext = extension;

    this._textDocumentService = TextDocumentServiceFactory.create(this._ext);
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

    this.sendInitialState(webviewPanel.webview, document);
  }

  private async sendInitialState(
    webview: vscode.Webview,
    document: vscode.TextDocument
  ) {
    const note = await this._textDocumentService.processTextDocument(document);
    // note = this.rewriteImageUrls(note, panel);

    webview.postMessage({
      type: DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
      data: {
        note,
        syncChangedNote: false,
      },
      source: "vscode",
    } as OnDidChangeActiveTextEditorMsg);

    // const msg: EditorInitMessage = {
    //   type: EditorMessageEnum.initialDocumentState,
    //   data: document.getText(),
    //   source: DMessageSource.vscode,
    // };
    // return webview.postMessage(msg);
  }

  private setupCallbacks(
    webview: vscode.Webview,
    document: vscode.TextDocument
  ): void {
    // Callback on getting a message back from the webview
    webview.onDidReceiveMessage(async (msg: EditorChangeMessage) => {
      const ctx = "ShowPreview:onDidReceiveMessage";
      switch (msg.type) {
        case EditorMessageEnum.documentChanged: {
          // const zeroIndexedLineNumber = msg.data.lineNumber - 1;
          // console.log(
          //   `Msg Received: Line: ${zeroIndexedLineNumber} | Text: ${msg.data.text} | EditType: ${msg.data.editType} | NodeType: ${msg.data.nodeType}`
          // );

          msg.data.sort((a, b) => {
            if (a.editType === "deletion" && b.editType === "deletion") {
              if (a.nodeType === "text") {
                return -1;
              }
            }
            return 0;
          });

          for (const editorChange of msg.data) {
            const zeroIndexedLineNumber = editorChange.lineNumber - 1;

            const edit = new vscode.WorkspaceEdit();

            if (editorChange.editType === "insertion") {
              if (editorChange.nodeType === "text") {
                // console.log(
                //   `Doing Replace. Existing Line: ${
                //     document.lineAt(zeroIndexedLineNumber).text
                //   }`
                // );
                const lineDiff = zeroIndexedLineNumber - document.lineCount + 1;

                if (lineDiff > 0) {
                  edit.insert(
                    document.uri,
                    new vscode.Position(
                      document.lineCount - 1,
                      document.lineAt(document.lineCount - 1).text.length
                    ),
                    _.repeat("\n", lineDiff)
                  );
                }
                edit.replace(
                  document.uri,
                  new vscode.Range(
                    zeroIndexedLineNumber,
                    0,
                    zeroIndexedLineNumber,
                    lineDiff > 0
                      ? 0
                      : document.lineAt(zeroIndexedLineNumber).text.length
                  ),
                  editorChange.text
                );
              } else if (editorChange.nodeType === "lineBreak") {
                edit.insert(
                  document.uri,
                  new vscode.Position(
                    zeroIndexedLineNumber,
                    document.lineAt(zeroIndexedLineNumber).text.length
                  ),
                  "\n"
                );
              }
            } else if (editorChange.editType === "deletion") {
              if (editorChange.nodeType === "lineBreak") {
                edit.delete(
                  document.uri,
                  new vscode.Range(
                    zeroIndexedLineNumber,
                    document.lineAt(zeroIndexedLineNumber).text.length,
                    zeroIndexedLineNumber + 1,
                    0
                  )
                );
              } else if (editorChange.nodeType === "text") {
                edit.delete(
                  document.uri,
                  new vscode.Range(
                    zeroIndexedLineNumber,
                    0,
                    zeroIndexedLineNumber,
                    document.lineAt(zeroIndexedLineNumber).text.length
                  )
                );
              }
            }

            //TODO: Fix later
            // eslint-disable-next-line no-await-in-loop
            await vscode.workspace.applyEdit(edit);
          }
          break;
        }
        default:
          break;
        // console.log("Unknown Message Received");
      }
    });
  }
}
