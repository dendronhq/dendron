import {
  NoteProps,
  OnDidChangeActiveTextEditorMsg,
  TreeViewMessage,
  TreeViewMessageType,
} from "@dendronhq/common-all";
import * as vscode from "vscode";
import { GotoNoteCommand } from "../commands/GotoNote";
import { DendronViewKey } from "../constants";
import { Logger } from "../logger";
import { getEngine, getWS } from "../workspace";
import { WebViewUtils } from "./utils";

export class DendronTreeViewV2 implements vscode.WebviewViewProvider {
  public static readonly viewType = DendronViewKey.TREE_VIEW_V2;

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
        data: {
          note,
          sync: true,
        },
        source: "vscode",
      } as OnDidChangeActiveTextEditorMsg);
    }
  }

  private _getHtmlForWebview(_webview: vscode.Webview) {
    return WebViewUtils.genHTML({
      title: "Tree View",
      view: DendronViewKey.TREE_VIEW_V2,
    });
  }
}
