import {
  assertUnreachable,
  CalendarViewMessage,
  CalendarViewMessageType,
  DendronTreeViewKey,
  DMessage,
  DMessageEnum,
  NoteProps,
  NoteUtils,
  OnDidChangeActiveTextEditorMsg,
} from "@dendronhq/common-all";
import _ from "lodash";
import * as vscode from "vscode";
import { CreateDailyJournalCommand } from "../commands/CreateDailyJournal";
import { GotoNoteCommand } from "../commands/GotoNote";
import { IDendronExtension } from "../dendronExtensionInterface";
import { Logger } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";
import { WSUtilsV2 } from "../WSUtilsV2";
import { WebViewUtils } from "./utils";

export class CalendarView implements vscode.WebviewViewProvider {
  public static readonly viewType = DendronTreeViewKey.CALENDAR_VIEW;
  private _view?: vscode.WebviewView;
  private _extension: IDendronExtension;

  constructor(extension: IDendronExtension) {
    this._extension = extension;
    this._extension.addDisposable(
      vscode.window.onDidChangeActiveTextEditor(
        // An `ChangeActiveTextEditor` event might be immediately followed by a new one (e.g. switch TextDocument).
        // This would result in the first call to unset `noteActive` and the seconde one to set it again. This might create flashing UI changes that disturb the eye.
        _.debounce(this.onActiveTextEditorChangeHandler, 100),
        this
      )
    );
    this._extension.addDisposable(
      vscode.workspace.onDidSaveTextDocument(
        this.onDidSaveTextDocumentHandler,
        this
      )
    );
  }

  openTextDocument(document: vscode.TextDocument) {
    if (_.isUndefined(document) || _.isUndefined(this._view)) {
      return;
    }
    if (!this._view.visible) {
      return;
    }
    const ctx = "CalendarView:openTextDocument";
    if (
      !this._extension.workspaceService?.isPathInWorkspace(document.uri.fsPath)
    ) {
      Logger.info({
        ctx,
        uri: document.uri.fsPath,
        msg: "not in workspace",
      });
      return;
    }
    const utils = new WSUtilsV2(this._extension);
    const note = utils.getNoteFromDocument(document);
    if (note) {
      Logger.info({
        ctx,
        msg: "refresh note",
        note: NoteUtils.toLogObj(note),
      });
      this.refresh(note);
    }
  }

  async onDidSaveTextDocumentHandler(document: vscode.TextDocument) {
    this.openTextDocument(document); // TODO optimize so that it only executes on daily notes
  }

  async onActiveTextEditorChangeHandler() {
    const document = VSCodeUtils.getActiveTextEditor()?.document;
    if (document) {
      this.openTextDocument(document);
    } else {
      this.refresh(); // call refresh without note so that `noteActive` gets unset.
    }
  }

  async onDidReceiveMessageHandler(msg: CalendarViewMessage) {
    const ctx = "onDidReceiveMessage";
    Logger.info({ ctx, data: msg });
    switch (msg.type) {
      case CalendarViewMessageType.onSelect: {
        Logger.info({
          ctx: `${ctx}:onSelect`,
          data: msg.data,
        });
        const { id, fname } = msg.data;
        let note: NoteProps | undefined;
        // eslint-disable-next-line no-cond-assign
        if (id && (note = this._extension.getEngine().notes[id])) {
          await new GotoNoteCommand(this._extension).execute({
            qs: note.fname,
            vault: note.vault,
          });
        } else if (fname) {
          await new CreateDailyJournalCommand(this._extension).execute({
            fname,
          });
        }
        break;
      }
      case CalendarViewMessageType.onGetActiveEditor: {
        this.onActiveTextEditorChangeHandler(); // initial call
        break;
      }
      case CalendarViewMessageType.messageDispatcherReady:
        // Exception was thrown on this event, hence including it in the case statement
        // but as far as it seems there isn't much we need to do for Calendar to work.
        break;
      default:
        assertUnreachable(msg.type);
        break;
    }
  }

  public postMessage(msg: DMessage) {
    this._view?.webview.postMessage(msg);
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    const ctx = "CalendarView:resolveWebView";
    this._view = webviewView;
    const start = process.hrtime();
    Logger.info({ ctx, msg: "enter", start });
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [],
    };
    webviewView.webview.html = await this._getHtmlForWebview(
      webviewView.webview
    );
    webviewView.webview.onDidReceiveMessage(
      this.onDidReceiveMessageHandler,
      this
    );
  }

  public refresh(note?: NoteProps) {
    if (this._view) {
      // When the last note is closed the note will be undefined and we do not
      // want to auto expand the calendar if there are no notes.
      if (note) {
        this._view.show?.(true);
      }
      this._view.webview.postMessage({
        type: DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
        data: {
          note,
          syncChangedNote: true,
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
