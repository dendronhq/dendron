import {
  DendronError,
  DMessageEnum,
  GraphViewMessage,
  GraphViewMessageType,
  NoteProps,
  NoteUtils,
  OnDidChangeActiveTextEditorMsg,
} from "@dendronhq/common-all";
import { EngineEventEmitter, WorkspaceUtils } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { Disposable, TextEditor, ViewColumn, window } from "vscode";
import { GotoNoteCommand } from "../../commands/GotoNote";
import { Logger } from "../../logger";
import { GraphStyleService } from "../../styles";
import { VSCodeUtils } from "../../vsCodeUtils";
import { DendronExtension } from "../../workspace";

export class NoteGraphPanelFactory {
  private static _panel: vscode.WebviewPanel | undefined = undefined;
  private static _onEngineNoteStateChangedDisposable: Disposable | undefined;
  private static _engineEvents: EngineEventEmitter;
  private static _ext: DendronExtension;

  static create(
    ext: DendronExtension,
    engineEvents: EngineEventEmitter
  ): vscode.WebviewPanel {
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
      this._ext = ext;
      this._engineEvents = engineEvents;
      this._ext.context.subscriptions.push(
        window.onDidChangeActiveTextEditor(this.onOpenTextDocument, this)
      );

      this._onEngineNoteStateChangedDisposable =
        this._engineEvents.onEngineNoteStateChanged((noteChangeEntry) => {
          const ctx = "NoteGraphViewFactoryEngineNoteStateChanged";
          Logger.info({ ctx });
          if (this._panel && this._panel.visible) {
            noteChangeEntry.map((changeEntry) =>
              this.refresh(changeEntry.note)
            );
          }
        });

      this._panel.webview.onDidReceiveMessage(async (msg: GraphViewMessage) => {
        const ctx = "ShowNoteGraph:onDidReceiveMessage";
        Logger.debug({ ctx, msgType: msg.type });

        switch (msg.type) {
          case GraphViewMessageType.onSelect: {
            const note = this._ext.getEngine().notes[msg.data.id];
            await new GotoNoteCommand(this._ext).execute({
              qs: note.fname,
              vault: note.vault,
              column: ViewColumn.One,
            });
            break;
          }
          case GraphViewMessageType.onGetActiveEditor: {
            const document = VSCodeUtils.getActiveTextEditor()?.document;
            const { vaults, wsRoot } = this._ext.getDWorkspace();
            if (document) {
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
              const note = this._ext.wsUtils.getNoteFromDocument(document);
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
            break;
        }
      });

      this._panel.onDidDispose(() => {
        this._panel = undefined;
        if (this._onEngineNoteStateChangedDisposable) {
          this._onEngineNoteStateChangedDisposable.dispose();
        }
      });
    }
    return this._panel;
  }

  static refresh(note: NoteProps): any {
    if (this._panel) {
      this._panel.webview.postMessage({
        type: DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
        data: {
          note,
          syncChangedNote: true,
          activeNote: this._ext.wsUtils.getActiveNote(),
        },
        source: "vscode",
      } as OnDidChangeActiveTextEditorMsg);
    }
  }

  static async onOpenTextDocument(editor: TextEditor | undefined) {
    if (_.isUndefined(editor) || _.isUndefined(this._panel)) {
      return;
    }
    if (!this._panel.visible) {
      return;
    }
    const uri = editor.document.uri;
    const basename = path.basename(uri.fsPath);
    const { wsRoot, vaults } = this._ext.getDWorkspace();
    if (
      !WorkspaceUtils.isPathInWorkspace({ wsRoot, vaults, fpath: uri.fsPath })
    ) {
      return;
    }
    if (basename.endsWith(".md")) {
      const note = this._ext.wsUtils.getNoteFromDocument(editor.document);
      if (note) {
        this.refresh(note);
      }
    }
  }
}
