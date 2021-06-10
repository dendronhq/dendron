import {
  DendronTreeViewKey,
  CalendarViewMessage,
  NoteProps,
  CalendarViewMessageType,
  OnDidChangeActiveTextEditorMsg,
  DMessage,
  NoteUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import * as vscode from "vscode";
import { WebViewUtils } from "./utils";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace, getEngine, getWS } from "../workspace";
import { GotoNoteCommand } from "../commands/GotoNote";
import { CreateDailyJournalCommand } from "../commands/CreateDailyJournal";
import { Logger } from "../logger";

export class CalendarView implements vscode.WebviewViewProvider {
  public static readonly viewType = DendronTreeViewKey.CALENDAR_VIEW;
  private _view?: vscode.WebviewView;

  constructor() {
    const dendronWorkspace = DendronWorkspace.instance();
    dendronWorkspace.addDisposable(
      vscode.window.onDidChangeActiveTextEditor(
        // An `ChangeActiveTextEditor` event might be immediately followed by a new one (e.g. switch TextDocument).
        // This would result in the first call to unset `noteActive` and the seconde one to set it again. This might create flashing UI changes that disturb the eye.
        _.debounce(this.handleActiveTextEditorChange, 100),
        this
      )
    );
    dendronWorkspace.addDisposable(
      vscode.workspace.onDidSaveTextDocument(this.handleSaveTextDocument, this)
    );
  }

  openTextDocument(document: vscode.TextDocument) {
    const ctx = "CalendarView:openTextDocument";
    if (!getWS().workspaceService?.isPathInWorkspace(document.uri.fsPath)) {
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
        ctx,
        msg: "refresh note",
        note: NoteUtils.toLogObj(note),
      });
      this.refresh(note);
    }
  }

  async handleSaveTextDocument(document: vscode.TextDocument) {
    this.openTextDocument(document); // TODO optimize for only daily notes
  }

  async handleActiveTextEditorChange() {
    const document = VSCodeUtils.getActiveTextEditor()?.document;
    if (document) {
      this.openTextDocument(document);
    } else {
      this.refresh(); // call refresh without note so that `noteActive` gets unset.
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
            Logger.info({
              ctx: "onDidReceiveMessage:onSelect",
              data: msg.data,
            });
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
          case CalendarViewMessageType.onGetActiveEditor: {
            this.handleActiveTextEditorChange(); // initial call
            break;
          }
          default:
            console.log("got data", msg);
            break;
        }
      }
    );
  }

  public refresh(note?: NoteProps) {
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
      view: DendronTreeViewKey.CALENDAR_VIEW,
    });
  }
}
