import {
  ConfigUtils,
  DendronEditorViewKey,
  DMessageEnum,
  DMessageSource,
  EditorChangeMessage,
  EditorDelete,
  EditorInitMessage,
  EditorInsert,
  EditorMessageEnum,
  EditorMessageType,
  EditorReplace,
  getWebEditorViewEntry,
  NoteProps,
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
    // const note = await this._textDocumentService.processTextDocument(document);
    // note = this.rewriteImageUrls(note, panel);

    //TODO: Fix.
    const note: NoteProps = {} as NoteProps;
    note.body = document.getText();

    webview.postMessage({
      type: EditorMessageEnum.initialDocumentState,
      data: document.getText(),
      source: "vscode",
    });
  }

  private setupCallbacks(
    webview: vscode.Webview,
    document: vscode.TextDocument
  ): void {
    // Callback on getting a message back from the webview
    webview.onDidReceiveMessage(async (msg: EditorChangeMessage) => {
      const ctx = "ShowPreview:onDidReceiveMessage";
      switch (msg.type) {
        case DMessageEnum.MESSAGE_DISPATCHER_READY: {
          console.log(`Msg Dispatcher Ready`);
          await this.sendInitialState(webview, document);
          break;
        }
        case EditorMessageEnum.documentChanged: {
          // const zeroIndexedLineNumber = msg.data.lineNumber - 1;
          console.log(`Msg Received: ${JSON.stringify(msg.data)}`);

          // TODO: Probably need to sort to do all replaces first, followed by insert/delete?
          for (const editorChange of msg.data) {
            const edit = new vscode.WorkspaceEdit();

            switch (editorChange.editType) {
              case "delete": {
                const payload: EditorDelete =
                  editorChange.payload as EditorDelete;
                edit.delete(
                  document.uri,
                  new vscode.Range(
                    payload.range.start.line,
                    payload.range.start.column,
                    payload.range.end.line,
                    payload.range.end.column
                  )
                );
                break;
              }
              case "insert": {
                const payload: EditorInsert =
                  editorChange.payload as EditorInsert;

                const lineDiff = payload.position.line - document.lineCount + 1;

                if (lineDiff > 0) {
                  edit.insert(
                    document.uri,
                    new vscode.Position(
                      document.lineCount - 1,
                      document.lineAt(document.lineCount - 1).text.length
                    ),
                    _.repeat("\n", lineDiff) + payload.newText
                  );
                } else {
                  edit.insert(
                    document.uri,
                    new vscode.Position(
                      payload.position.line,
                      payload.position.column
                    ),
                    payload.newText
                  );
                }
                break;
              }
              case "replace": {
                const payload: EditorReplace =
                  editorChange.payload as EditorReplace;

                edit.replace(
                  document.uri,
                  new vscode.Range(
                    payload.range.start.line,
                    payload.range.start.column,
                    payload.range.end.line,
                    payload.range.end.column
                  ),
                  payload.newText
                );
                break;
              }
              default:
                break;
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
