import {
  assertUnreachable,
  DendronEditorViewKey,
  DMessageEnum,
  getWebEditorViewEntry,
  isWebUri,
  NoteProps,
  NoteUtils,
  NoteViewMessage,
  NoteViewMessageEnum,
  OnDidChangeActiveTextEditorMsg,
} from "@dendronhq/common-all";
import _ from "lodash";
import * as vscode from "vscode";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { Logger } from "../../logger";
import { INoteSyncService } from "../../services/NoteSyncService";
import { sentryReportingCallback } from "../../utils/analytics";
import { WebViewUtils } from "../../views/utils";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WSUtilsV2 } from "../../WSUtilsV2";
import { IPreviewLinkHandler } from "./PreviewLinkHandler";
import { PreviewProxy } from "./PreviewProxy";

/**
 * This is the default implementation of PreviewProxy. It contains a singleton
 * of a vscode webviewPanel that renders the note preview. Furthermore, it will
 * automatically handle event subscriptions to know when to update the preview,
 * as well as properly dispose of the resources when the preview has been
 * closed.
 */
export class PreviewPanel implements PreviewProxy, vscode.Disposable {
  private _ext: IDendronExtension;
  private _panel: vscode.WebviewPanel | undefined;
  private _noteSyncService: INoteSyncService;
  private _onDidChangeActiveTextEditor: vscode.Disposable | undefined =
    undefined;
  private _onNoteChanged: vscode.Disposable | undefined = undefined;
  private _linkHandler: IPreviewLinkHandler;

  /**
   *
   * @param param0 extension - IDendronExtension implementation. linkHandler -
   * Implementation to handle preview link clicked events
   */
  constructor({
    extension,
    linkHandler,
  }: {
    extension: IDendronExtension;
    linkHandler: IPreviewLinkHandler;
  }) {
    this._ext = extension;
    this._linkHandler = linkHandler;
    this._noteSyncService = this._ext.noteSyncService;
  }

  /**
   * Show the preview.
   * @param note - if specified, this will override the preview contents with
   * the contents specified in this parameter. Otherwise, the contents of the
   * preview will follow default behavior (it will show the currently in-focus
   * Dendron note).
   */
  show(note?: NoteProps): void {
    if (this._panel) {
      if (!this.isVisible()) {
        this._panel.reveal();
      }
    } else {
      const viewColumn = vscode.ViewColumn.Beside; // Editor column to show the new webview panel in.
      const preserveFocus = true;

      const { bundleName: name, label } = getWebEditorViewEntry(
        DendronEditorViewKey.NOTE_PREVIEW
      );

      this._panel = vscode.window.createWebviewPanel(
        name,
        label,
        {
          viewColumn,
          preserveFocus,
        },
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          enableFindWidget: true,
          localResourceRoots: WebViewUtils.getLocalResourceRoots(
            this._ext.context
          ),
        }
      );

      const port = this._ext.port!;
      const engine = this._ext.getEngine();
      const { wsRoot } = engine;

      const webViewAssets = WebViewUtils.getJsAndCss(name);

      const html = WebViewUtils.getWebviewContent({
        ...webViewAssets,
        port,
        wsRoot,
        panel: this._panel,
      });

      this._panel.webview.html = html;

      this.setupCallbacks();

      this._panel.onDidDispose(() => {
        if (this._onDidChangeActiveTextEditor) {
          this._onDidChangeActiveTextEditor.dispose();
          this._onDidChangeActiveTextEditor = undefined;
        }

        if (this._onNoteChanged) {
          this._onNoteChanged.dispose();
          this._onNoteChanged = undefined;
        }

        this._panel = undefined;
      });

      this._panel.reveal(viewColumn, preserveFocus);
    }

    if (note) {
      this.updateForNote(note);
    }
  }
  hide(): void {
    this.dispose();
  }
  isOpen(): boolean {
    return this._panel !== undefined;
  }
  isVisible(): boolean {
    return this._panel !== undefined && this._panel.visible;
  }
  dispose() {
    if (this._panel) {
      this._panel.dispose();
      this._panel = undefined;
    }
  }

  private setupCallbacks(): void {
    const wsUtils = new WSUtilsV2(this._ext);

    // Callback on getting a message back from the webview
    this._panel!.webview.onDidReceiveMessage(async (msg: NoteViewMessage) => {
      const ctx = "ShowPreview:onDidReceiveMessage";
      Logger.debug({ ctx, msgType: msg.type });
      switch (msg.type) {
        case DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR:
        case DMessageEnum.INIT: {
          // do nothing
          break;
        }
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
            note = wsUtils.getActiveNote();
            if (note) {
              Logger.debug({
                ctx,
                msg: "got active note",
                note: NoteUtils.toLogObj(note),
              });
            }
          }
          if (note) {
            this.sendRefreshMessage(this._panel!, note);
          }
          break;
        }
        case NoteViewMessageEnum.onClick: {
          const { data } = msg;
          this._linkHandler.onLinkClicked({ data });
          break;
        }
        case NoteViewMessageEnum.onGetActiveEditor: {
          Logger.debug({ ctx, "msg.type": "onGetActiveEditor" });
          const activeTextEditor = VSCodeUtils.getActiveTextEditor();
          const maybeNote = !_.isUndefined(activeTextEditor)
            ? this._ext.wsUtils.tryGetNoteFromDocument(
                activeTextEditor?.document
              )
            : undefined;

          if (!_.isUndefined(maybeNote)) {
            this.sendRefreshMessage(this._panel!, maybeNote);
          }
          break;
        }
        case NoteViewMessageEnum.imagePreviewUrl: {
          Logger.debug({ ctx, "msg.type": "imagePreviewUrl" });
          const { href } = msg.data;
          if (!href || isWebUri(href)) break;
          const mappedTo = this._panel!.webview.asWebviewUri(
            vscode.Uri.file(href)
          );
          this._panel!.webview.postMessage({
            type: NoteViewMessageEnum.imagePreviewUrl,
            data: {
              url: href,
              mappedTo,
            },
            source: "vscode",
          });
          break;
        }
        default:
          assertUnreachable(msg.type);
      }
    });

    // If the user changes focus, then the newly in-focus Dendron note should be
    // shown in the preview
    this._onDidChangeActiveTextEditor =
      vscode.window.onDidChangeActiveTextEditor(
        sentryReportingCallback((editor: vscode.TextEditor | undefined) => {
          if (
            !editor ||
            editor.document.uri.fsPath !==
              vscode.window.activeTextEditor?.document.uri.fsPath
          ) {
            return;
          }

          const uri = editor.document.uri;
          if (!this._ext.workspaceService?.isPathInWorkspace(uri.fsPath)) {
            return;
          }

          const maybeNote = this._ext.wsUtils.tryGetNoteFromDocument(
            editor.document
          );

          if (!maybeNote) {
            return;
          }

          this._panel!.webview.postMessage({
            type: DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
            data: {
              note: maybeNote,
              syncChangedNote: true,
            },
            source: "vscode",
          } as OnDidChangeActiveTextEditorMsg);
        })
      );

    // If the note contents have changed, update the preview with the new
    // contents.
    this._onNoteChanged = this._noteSyncService.onNoteChange(
      (note: NoteProps) => {
        this.updateForNote(note);
      }
    );

    this._ext.addDisposable(this._onDidChangeActiveTextEditor);
    this._ext.addDisposable(this._onNoteChanged);
  }

  private sendRefreshMessage(panel: vscode.WebviewPanel, note: NoteProps) {
    const syncChangedNote = true;
    return panel.webview.postMessage({
      type: DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
      data: {
        note,
        syncChangedNote,
      },
      source: "vscode",
    } as OnDidChangeActiveTextEditorMsg);
  }

  private async updateForNote(note: NoteProps) {
    if (this._panel) {
      return this.sendRefreshMessage(this._panel, note);
    }
    return undefined;
  }

  private initWithNote: NoteProps | undefined;
}
