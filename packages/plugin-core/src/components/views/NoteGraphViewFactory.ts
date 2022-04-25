import {
  DendronEditorViewKey,
  DendronError,
  DMessageEnum,
  DMessageSource,
  getWebEditorViewEntry,
  GraphThemeEnum,
  GraphViewMessage,
  GraphViewMessageEnum,
  NoteProps,
  NoteUtils,
  OnDidChangeActiveTextEditorMsg,
} from "@dendronhq/common-all";
import {
  EngineEventEmitter,
  MetadataService,
  WorkspaceUtils,
} from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { Disposable, TextEditor, ViewColumn, window } from "vscode";
import { GotoNoteCommand } from "../../commands/GotoNote";
import { DENDRON_COMMANDS } from "../../constants";
import { Logger } from "../../logger";
import { GraphStyleService } from "../../styles";
import { WebViewUtils } from "../../views/utils";
import { AnalyticsUtils } from "../../utils/analytics";
import { VSCodeUtils } from "../../vsCodeUtils";
import { DendronExtension } from "../../workspace";

export class NoteGraphPanelFactory {
  private static _panel: vscode.WebviewPanel | undefined = undefined;
  private static _onEngineNoteStateChangedDisposable: Disposable | undefined;
  private static _engineEvents: EngineEventEmitter;
  private static _ext: DendronExtension;
  private static initWithNote: NoteProps | undefined;
  private static defaultGraphTheme: GraphThemeEnum | undefined;

  static create(
    ext: DendronExtension,
    engineEvents: EngineEventEmitter
  ): vscode.WebviewPanel {
    if (!this._panel) {
      const { bundleName: name, label } = getWebEditorViewEntry(
        DendronEditorViewKey.NOTE_GRAPH
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
          enableFindWidget: false,
          localResourceRoots: WebViewUtils.getLocalResourceRoots(ext.context),
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

      // listener
      this._panel.webview.onDidReceiveMessage(async (msg: GraphViewMessage) => {
        const ctx = "ShowNoteGraph:onDidReceiveMessage";
        Logger.debug({ ctx, msgType: msg.type });
        switch (msg.type) {
          case GraphViewMessageEnum.onSelect: {
            const note = this._ext.getEngine().notes[msg.data.id];
            await new GotoNoteCommand(this._ext).execute({
              qs: note.fname,
              vault: note.vault,
              column: ViewColumn.One,
            });
            AnalyticsUtils.track(DENDRON_COMMANDS.SHOW_NOTE_GRAPH.key, {
              message: GraphViewMessageEnum.onSelect,
            });
            break;
          }
          case GraphViewMessageEnum.onGetActiveEditor: {
            const editor = VSCodeUtils.getActiveTextEditor();
            this.onOpenTextDocument(editor);
            break;
          }
          case GraphViewMessageEnum.onRequestGraphStyle: {
            // Set graph styles
            const styles = GraphStyleService.getParsedStyles();
            if (styles) {
              this._panel!.webview.postMessage({
                type: GraphViewMessageEnum.onGraphStyleLoad,
                data: {
                  styles,
                },
                source: "vscode",
              });
            }
            break;
          }
          case GraphViewMessageEnum.onReady:
            throw new DendronError({
              message: "Unexpected message received from the graph view",
              payload: {
                ctx: "NoteGraphPanelFactory",
                "msg.type": msg.type,
              },
            });

          case DMessageEnum.MESSAGE_DISPATCHER_READY: {
            // if ready, get current note
            let note: NoteProps | undefined;
            if (this.initWithNote !== undefined) {
              note = this.initWithNote;
              Logger.debug({
                ctx,
                msg: "got pre-set note",
                note: NoteUtils.toLogObj(note),
              });
            } else {
              note = this._ext.wsUtils.getActiveNote();
              if (note) {
                Logger.debug({
                  ctx,
                  msg: "got active note",
                  note: NoteUtils.toLogObj(note),
                });
              }
            }
            if (note) {
              this.refresh(note);
            }
            break;
          }
          case GraphViewMessageEnum.onGraphThemeChange: {
            this.defaultGraphTheme = msg.data.defaultGraphTheme;
            break;
          }
          case GraphViewMessageEnum.onRequestDefaultGraphTheme: {
            const defaultGraphTheme =
              MetadataService.instance().getDefaultGraphTheme();
            if (defaultGraphTheme) {
              this._panel!.webview.postMessage({
                type: GraphViewMessageEnum.onDefaultGraphThemeLoad,
                data: {
                  defaultGraphTheme,
                },
                source: "vscode",
              });
            }
            break;
          }
          default:
            break;
        }
      });

      this._panel.onDidDispose(() => {
        this._panel = undefined;
        if (this._onEngineNoteStateChangedDisposable) {
          this._onEngineNoteStateChangedDisposable.dispose();
        }
        if (this.defaultGraphTheme) {
          MetadataService.instance().setDefaultGraphTheme(
            this.defaultGraphTheme
          );
        }
      });
    }
    return this._panel;
  }

  /**
   * Post message to the webview content.
   * @param note
   */
  static refresh(note: NoteProps): any {
    if (this._panel) {
      this._panel.webview.postMessage({
        type: DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
        data: {
          note,
          syncChangedNote: true,
          activeNote: this._ext.wsUtils.getActiveNote(),
        },
        source: DMessageSource.vscode,
      } as OnDidChangeActiveTextEditorMsg);
    }
  }
  /**
   * If the user changes focus, then the newly in-focus Dendron note
   * should be shown in the graph.
   */
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
