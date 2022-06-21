import {
  DendronEditorViewKey,
  getWebEditorViewEntry,
} from "@dendronhq/common-all";
import { EngineEventEmitter } from "@dendronhq/engine-server";
import _ from "lodash";
import * as vscode from "vscode";
// import { Disposable } from "vscode";
import { DendronExtension } from "../../workspace";

export class VisualizationFactory {
  private static _panel: vscode.WebviewPanel | undefined = undefined;
  // private static _onEngineNoteStateChangedDisposable: Disposable | undefined;
  // private static _engineEvents: EngineEventEmitter;
  // private static _ext: DendronExtension;
  // private static initWithNote: NoteProps | undefined;

  static create(
    _ext: DendronExtension,
    _engineEvents: EngineEventEmitter
  ): vscode.WebviewPanel {
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
      {}
    );

    // this._ext = ext;
    // this._engineEvents = engineEvents;

    // this._ext.context.subscriptions.push(
    //   window.onDidChangeActiveTextEditor(this.onOpenTextDocument, this)
    // );

    return this._panel;
  }
}
