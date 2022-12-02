import {
  CalendarViewMessage,
  CalendarViewMessageType,
  DendronTreeViewKey,
  DMessage,
  DMessageEnum,
  NoteProps,
  NoteUtils,
  OnDidChangeActiveTextEditorMsg,
} from "@dendronhq/common-all";
import { WorkspaceUtils } from "@dendronhq/engine-server";
import _ from "lodash";
import * as vscode from "vscode";
import { CreateDailyJournalCommand } from "../commands/CreateDailyJournal";
import { GotoNoteCommand } from "../commands/GotoNote";
import { IDendronExtension } from "../dendronExtensionInterface";
import { Logger } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";
import { WebViewUtils } from "./utils";

export class CalendarView implements vscode.WebviewViewProvider {
  public static readonly viewType = DendronTreeViewKey.CALENDAR_VIEW;
  private _view?: vscode.WebviewView;
  private _extension: IDendronExtension;
  constructor(extension: IDendronExtension) {
    this._extension = extension;
    this._extension.context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor(this.onOpenTextDocument, this)
    );
  }

  public postMessage(msg: DMessage) {
    this._view?.webview.postMessage(msg);
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext<unknown>,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    await WebViewUtils.prepareTreeView({
      ext: this._extension,
      key: DendronTreeViewKey.CALENDAR_VIEW,
      webviewView,
    });
    webviewView.webview.onDidReceiveMessage(
      this.onDidReceiveMessageHandler,
      this
    );
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
        // eslint-disable-next-line no-cond-assign
        if (id) {
          const note = (await this._extension.getEngine().getNoteMeta(id)).data;
          if (note) {
            await new GotoNoteCommand(this._extension).execute({
              qs: note.fname,
              vault: note.vault,
            });
          }
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
      case CalendarViewMessageType.messageDispatcherReady: {
        const note = await this._extension.wsUtils.getActiveNote();
        if (note) {
          await this.refresh(note);
        }
        break;
      }
      default:
        break;
    }
  }

  async onActiveTextEditorChangeHandler() {
    const editor = VSCodeUtils.getActiveTextEditor();
    if (editor?.document) {
      this.onOpenTextDocument(editor);
    } else {
      this.refresh(); // call refresh without note so that `noteActive` gets unset.
    }
  }

  async onOpenTextDocument(editor: vscode.TextEditor | undefined) {
    const document = editor?.document;
    if (_.isUndefined(document) || _.isUndefined(this._view)) {
      return;
    }
    if (!this._view.visible) {
      return;
    }
    const ctx = "CalendarView:openTextDocument";
    const ws = this._extension.getDWorkspace();
    const { wsRoot } = ws;
    const vaults = await ws.vaults;
    if (
      !WorkspaceUtils.isPathInWorkspace({
        wsRoot,
        vaults,
        fpath: document.uri.fsPath,
      })
    ) {
      Logger.info({
        ctx,
        uri: document.uri.fsPath,
        msg: "not in workspace",
      });
      return;
    }
    const note = await this._extension.wsUtils.getNoteFromDocument(document);
    if (note) {
      Logger.info({
        ctx,
        msg: "refresh note",
        note: NoteUtils.toLogObj(note),
      });
      this.refresh(note);
    }
  }

  public async refresh(note?: NoteProps) {
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
          activeNote: await this._extension.wsUtils.getActiveNote(),
        },
        source: "vscode",
      } as OnDidChangeActiveTextEditorMsg);
    }
  }
}
