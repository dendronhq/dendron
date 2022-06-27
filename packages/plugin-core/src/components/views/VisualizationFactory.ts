import {
  DendronEditorViewKey,
  DMessageEnum,
  DMessageSource,
  getWebEditorViewEntry,
  GraphViewMessage,
  NoteProps,
  NoteUtils,
  OnDidChangeActiveTextEditorMsg,
} from "@dendronhq/common-all";
import { EngineEventEmitter } from "@dendronhq/engine-server";
import * as vscode from "vscode";
import { WebViewUtils } from "../../views/utils";
import { Logger } from "../../logger";
import { DendronExtension } from "../../workspace";

export class VisualizationFactory {
  private static _panel: vscode.WebviewPanel | undefined = undefined;
  // private static _onEngineNoteStateChangedDisposable: Disposable | undefined;
  // private static _engineEvents: EngineEventEmitter;
  private static _ext: DendronExtension;
  // private static initWithNote: NoteProps | undefined;

  static create(
    ext: DendronExtension,
    _engineEvents: EngineEventEmitter
  ): vscode.WebviewPanel {
    this._ext = ext;
    if (this._panel) return this._panel;

    const { bundleName: name, label } = getWebEditorViewEntry(
      DendronEditorViewKey.VISUALIZATION
    );

    /* Create a panel on which to display content */
    this._panel = vscode.window.createWebviewPanel(
      name,
      label,
      {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: true,
      },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        enableFindWidget: false,
        localResourceRoots: WebViewUtils.getLocalResourceRoots(ext.context),
      }
    );

    this._panel.webview.onDidReceiveMessage(async (msg: GraphViewMessage) => {
      const ctx = "VisualizationFactory:onDidReceiveMessage";
      Logger.debug({ ctx, msgType: msg.type });
      switch (msg.type) {
        case DMessageEnum.MESSAGE_DISPATCHER_READY: {
          // if ready, get current note
          const note: NoteProps | undefined = this._ext.wsUtils.getActiveNote();
          if (note) {
            Logger.debug({
              ctx,
              msg: "got active note",
              note: NoteUtils.toLogObj(note),
            });
          }
          if (note) {
            this.refresh(note);
          }
          break;
        }
        default:
          break;
      }
    });

    return this._panel;
  }

  static refresh(note: NoteProps, createStub?: boolean): any {
    if (this._panel) {
      this._panel.webview.postMessage({
        type: DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
        data: {
          note,
          syncChangedNote: true,
          activeNote:
            note.stub && !createStub ? note : this._ext.wsUtils.getActiveNote(),
        },
        source: DMessageSource.vscode,
      } as OnDidChangeActiveTextEditorMsg);
    }
  }
}
