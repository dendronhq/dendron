import {
  DendronCalendarViewKey,
  CalendarViewMessage,
  NoteProps,
  CalendarViewMessageType,
  OnDidChangeActiveTextEditorMsg,
  DMessage,
} from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { WebViewUtils } from "./utils";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace, getEngine, getWS } from "../workspace";
import { GotoNoteCommand } from "../commands/GotoNote";
import { CreateDailyJournalCommand } from "../commands/CreateDailyJournal";
import { Logger } from "../logger";

export class CalendarView implements vscode.WebviewViewProvider {
  public static readonly viewType = DendronCalendarViewKey.CALENDAR_VIEW;
  private _view?: vscode.WebviewView;

  constructor() {
    DendronWorkspace.instance().addDisposable(
      vscode.window.onDidChangeActiveTextEditor(this.onOpenTextDocument, this)
    );
  }

  async onOpenTextDocument(editor: vscode.TextEditor | undefined) {
    if (_.isUndefined(editor) || _.isUndefined(this._view)) {
      return;
    }
    if (!this._view.visible) {
      return;
    }
    const uri = editor.document.uri;
    const basename = path.basename(uri.fsPath);
    const ws = getWS();
    if (!ws.workspaceService?.isPathInWorkspace(uri.fsPath)) {
      return;
    }
    if (basename.endsWith(".md")) {
      const note = VSCodeUtils.getNoteFromDocument(editor.document);
      if (note) {
        this.refresh(note);
      }
    }
  }

  public postMessage(msg: DMessage) {
    this._view?.webview.postMessage(msg);
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    const ctx = "CalendarView:resolveWebView";
    this._view = webviewView;
    let start = process.hrtime();
    Logger.info({ ctx, msg: "enter", start });
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [],
    };
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    webviewView.webview.onDidReceiveMessage(
      async (msg: CalendarViewMessage) => {
        Logger.info({ ctx: "onDidReceiveMessage", data: msg });
        switch (msg.type) {
          case CalendarViewMessageType.onSelect: {
            console.log("onDidReceiveMessage:onSelect:data", msg.data);
            if (msg.data.id) {
              const note = getEngine().notes[msg.data.id];
              await new GotoNoteCommand().execute({
                qs: note.fname,
                vault: note.vault,
              });
            } else if (msg.data.fname) {
              await new CreateDailyJournalCommand().execute({
                fname: msg.data.fname,
              });
            }
            break;
          }
          default:
            console.log("got data", msg);
            break;
        }
      }
    );
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
    return WebViewUtils.genHTMLForView({
      title: "Calendar View",
      view: DendronCalendarViewKey.CALENDAR_VIEW,
    });
  }
}
