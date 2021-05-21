import {
  DendronViewKey,
  NoteProps,
  NoteUtils,
  OnDidChangeActiveTextEditorMsg,
  TreeViewMessage,
  TreeViewMessageType,
  VSCodeEvents,
} from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import * as vscode from "vscode";
import { GotoNoteCommand } from "../commands/GotoNote";
import { Logger } from "../logger";
import { VSCodeUtils } from "../utils";
import { AnalyticsUtils } from "../utils/analytics";
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
    const ctx = "DendronTreeViewV2:resolveWebView";
    this._view = webviewView;
    let start = process.hrtime();
    Logger.info({ ctx, msg: "enter", start });
    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    webviewView.webview.onDidReceiveMessage(async (msg: TreeViewMessage) => {
      Logger.info({ ctx: "onDidReceiveMessage", data: msg });
      switch (msg.type) {
        case TreeViewMessageType.onSelect: {
          const note = getEngine().notes[msg.data.id];
          await new GotoNoteCommand().execute({
            qs: note.fname,
            vault: note.vault,
          });
          break;
        }
        case TreeViewMessageType.onGetActiveEditor: {
          const document = VSCodeUtils.getActiveTextEditor()?.document;
          if (document) {
            if (
              !getWS().workspaceService?.isPathInWorkspace(document.uri.fsPath)
            ) {
              Logger.info({
                ctx,
                uri: document.uri.fsPath,
                msg: "not in workspace",
              });
              return;
            }
            const note = VSCodeUtils.getNoteFromDocument(document);
            if (note) {
              Logger.info({
                ctx: "onDidReceiveMessage",
                msg: "refresh note",
                note: NoteUtils.toLogObj(note),
              });
              this.refresh(note);
            }
          }
          break;
        }
        case TreeViewMessageType.onReady: {
          const profile = getDurationMilliseconds(start);
          Logger.info({ ctx, msg: "treeViewLoaded", profile, start });
          AnalyticsUtils.track(VSCodeEvents.TreeView_Ready, {
            duration: profile,
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
