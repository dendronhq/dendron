import {
  DendronEditorViewKey,
  getWebEditorViewEntry,
} from "@dendronhq/common-all";
import _ from "lodash";
import * as vscode from "vscode";
import { ViewColumn, window } from "vscode";
import { WebViewUtils } from "../../views/utils";
import { DendronExtension } from "../../workspace";

export class SchemaValidatorViewFactory {
  private static _panel: vscode.WebviewPanel | undefined = undefined;
  private static _vsCodeCallback: vscode.Disposable | undefined = undefined;

  //TODO: Limit scope of parameter from DendronExtension to only what's needed
  static create(ext: DendronExtension): vscode.WebviewPanel {
    if (this._panel) {
      return this._panel;
    }
    const { bundleName: name, label } = getWebEditorViewEntry(
      DendronEditorViewKey.SCHEMA_VALIDATOR
    );
    this._panel = window.createWebviewPanel(
      name, // Identifies the type of the webview. Used internally
      label, // Title of the panel displayed to the user
      {
        viewColumn: ViewColumn.Beside,
        preserveFocus: true,
      }, // Editor column to show the new webview panel in.
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        enableFindWidget: true,
        localResourceRoots: WebViewUtils.getLocalResourceRoots(ext.context),
      }
    );

    this._panel.onDidDispose(() => {
      this._panel = undefined;

      if (this._vsCodeCallback) {
        this._vsCodeCallback.dispose();
        this._vsCodeCallback = undefined;
      }
    });

    return this._panel;
  }
}
