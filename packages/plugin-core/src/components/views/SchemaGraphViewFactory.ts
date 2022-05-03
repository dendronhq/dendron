import {
  DendronEditorViewKey,
  DMessageEnum,
  getWebEditorViewEntry,
  GraphViewMessage,
  GraphViewMessageEnum,
  OnDidChangeActiveTextEditorMsg,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { Uri, ViewColumn, window } from "vscode";
import { Logger } from "../../logger";
import { sentryReportingCallback } from "../../utils/analytics";
import { WebViewUtils } from "../../views/utils";
import { VSCodeUtils } from "../../vsCodeUtils";
import { DendronExtension } from "../../workspace";

export class SchemaGraphViewFactory {
  private static _panel: vscode.WebviewPanel | undefined = undefined;
  private static _vsCodeCallback: vscode.Disposable | undefined = undefined;

  //TODO: Limit scope of parameter from DendronExtension to only what's needed
  static create(ext: DendronExtension): vscode.WebviewPanel {
    if (this._panel) {
      return this._panel;
    }
    const { bundleName: name, label } = getWebEditorViewEntry(
      DendronEditorViewKey.SCHEMA_GRAPH
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

    // Listener
    this._panel.webview.onDidReceiveMessage(async (msg: GraphViewMessage) => {
      const ctx = "ShowSchemaGraph:onDidReceiveMessage";
      Logger.debug({ ctx, msgType: msg.type });

      switch (msg.type) {
        case GraphViewMessageEnum.onSelect: {
          const engine = ext.getEngine();
          const schema = engine.schemas[msg.data.id];

          const wsRoot = ext.getEngine().wsRoot;

          await vscode.commands.executeCommand(
            "workbench.action.focusFirstEditorGroup"
          );
          if (msg.data.vault && wsRoot) {
            const vaults = engine.vaults.filter(
              (v) => VaultUtils.getName(v) === msg.data.vault
            );
            if (_.isEmpty(vaults)) return;

            const schemaPath = path.join(
              wsRoot,
              vaults[0].fsPath,
              `root.schema.yml`
            );
            const uri = Uri.file(schemaPath);

            await VSCodeUtils.openFileInEditor(uri);
          } else if (schema && wsRoot) {
            const fname = schema.fname;
            // const vault = schema.vault;

            const schemaPath = path.join(
              wsRoot,
              schema.vault.fsPath,
              `${fname}.schema.yml`
            );
            const uri = Uri.file(schemaPath);

            await VSCodeUtils.openFileInEditor(uri);
          }
          break;
        }
        // not handled
        case GraphViewMessageEnum.onGraphStyleAndThemeLoad: {
          break;
        }
        // TODO: these should be handled
        default:
          Logger.info({
            ctx,
            msg:
              "Unexpected message type from SchemaGraph Webview: " +
              JSON.stringify(msg),
          });
          break;
      }
    });

    this._vsCodeCallback = vscode.window.onDidChangeActiveTextEditor(
      sentryReportingCallback((editor: vscode.TextEditor | undefined) => {
        if (
          SchemaGraphViewFactory._panel &&
          SchemaGraphViewFactory._panel.visible
        ) {
          if (!editor) {
            return;
          }

          const note = ext.wsUtils.getNoteFromDocument(editor.document);

          SchemaGraphViewFactory._panel.webview.postMessage({
            type: DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
            data: {
              note,
              sync: true,
            },
            source: "vscode",
          } as OnDidChangeActiveTextEditorMsg);
        }
      })
    );

    ext.addDisposable(this._vsCodeCallback);

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
