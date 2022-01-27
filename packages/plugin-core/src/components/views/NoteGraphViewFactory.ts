import {
  assertUnreachable,
  DendronError,
  DMessageEnum,
  GraphViewMessage,
  GraphViewMessageType,
  OnDidChangeActiveTextEditorMsg,
} from "@dendronhq/common-all";
import * as vscode from "vscode";
import { ViewColumn, window } from "vscode";
import { GotoNoteCommand } from "../../commands/GotoNote";
import { Logger } from "../../logger";
import { GraphStyleService } from "../../styles";
import { sentryReportingCallback } from "../../utils/analytics";
import { VSCodeUtils } from "../../vsCodeUtils";
import { DendronExtension, getEngine, getExtension } from "../../workspace";
import { WSUtils } from "../../WSUtils";

export class NoteGraphPanelFactory {
  private static _panel: vscode.WebviewPanel | undefined = undefined;
  private static _vsCodeCallback: vscode.Disposable | undefined = undefined;

  static create(ext: DendronExtension): vscode.WebviewPanel {
    if (!this._panel) {
      this._panel = window.createWebviewPanel(
        "dendronIframe", // Identifies the type of the webview. Used internally
        "Note Graph", // Title of the panel displayed to the user
        {
          viewColumn: ViewColumn.Beside,
          preserveFocus: true,
        }, // Editor column to show the new webview panel in.
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          enableFindWidget: false,
        }
      );

      this._panel.webview.onDidReceiveMessage(async (msg: GraphViewMessage) => {
        const ctx = "ShowSchemaGraph:onDidReceiveMessage";
        Logger.debug({ ctx, msgType: msg.type });

        switch (msg.type) {
          case GraphViewMessageType.onSelect: {
            const note = getEngine().notes[msg.data.id];
            await new GotoNoteCommand(getExtension()).execute({
              qs: note.fname,
              vault: note.vault,
              column: ViewColumn.One,
            });
            break;
          }
          case GraphViewMessageType.onGetActiveEditor: {
            const activeTextEditor = VSCodeUtils.getActiveTextEditor();
            const note =
              activeTextEditor &&
              WSUtils.getNoteFromDocument(activeTextEditor.document);
            if (note) {
              this._panel!.webview.postMessage({
                type: DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
                data: {
                  note,
                  sync: true,
                },
                source: "vscode",
              });
            }
            break;
          }
          case GraphViewMessageType.onRequestGraphStyle: {
            // Set graph styles
            const styles = GraphStyleService.getParsedStyles();
            if (styles) {
              this._panel!.webview.postMessage({
                type: "onGraphStyleLoad",
                data: {
                  styles,
                },
                source: "vscode",
              });
            }
            break;
          }
          case GraphViewMessageType.onReady:
            throw new DendronError({
              message: "Unexpected message received from the graph view",
              payload: {
                ctx: "NoteGraphPanelFactory",
                "msg.type": msg.type,
              },
            });
          default:
            assertUnreachable(msg.type);
        }
      });

      this._vsCodeCallback = vscode.window.onDidChangeActiveTextEditor(
        sentryReportingCallback((editor: vscode.TextEditor | undefined) => {
          if (
            NoteGraphPanelFactory._panel &&
            NoteGraphPanelFactory._panel.visible
          ) {
            if (!editor) {
              return;
            }

            const note = WSUtils.getNoteFromDocument(editor.document);

            NoteGraphPanelFactory._panel.webview.postMessage({
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
    }
    return this._panel;
  }
}
