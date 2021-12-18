import {
  assertUnreachable,
  ConfigUtils,
  DendronEditorViewKey,
  DMessageEnum,
  getWebEditorViewEntry,
  NoteProps,
  NoteUtils,
  NoteViewMessage,
  NoteViewMessageEnum,
  OnDidChangeActiveTextEditorMsg,
} from "@dendronhq/common-all";
import _ from "lodash";
import * as vscode from "vscode";
import {
  handleLink,
  LinkType,
  ShowPreviewCommand,
} from "../../commands/ShowPreview";
import { Logger } from "../../logger";
import { sentryReportingCallback } from "../../utils/analytics";
import { WebViewUtils } from "../../views/utils";
import { VSCodeUtils } from "../../vsCodeUtils";
import { DendronExtension, getDWorkspace, getExtension } from "../../workspace";
import { WSUtils } from "../../WSUtils";

/**
 * Proxy for the Preview Panel
 */
export interface PreviewProxy {
  /**
   * Method to update the preview with the passed in NoteProps.
   * If automaticallyShowPreview is set to true, show preview panel if it doesn't exist
   * @param note Note Props to update the preview contents with
   */
  showPreviewAndUpdate(note: NoteProps): void;

  /**
   * Return current panel. Can be undefined. Exposed for testing only
   */
  getPanel(): vscode.WebviewPanel | undefined;
}

export class PreviewPanelFactory {
  private static _panel: vscode.WebviewPanel | undefined = undefined;
  private static _vsCodeCallback: vscode.Disposable | undefined = undefined;

  private static sendRefreshMessage(
    panel: vscode.WebviewPanel,
    note: NoteProps
  ) {
    panel.webview.postMessage({
      type: DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
      data: {
        note,
        syncChangedNote: true,
      },
      source: "vscode",
    } as OnDidChangeActiveTextEditorMsg);
  }

  private static classifyLink({ href }: NoteViewMessage["data"]): LinkType {
    if (
      href &&
      href.startsWith("vscode-webview") &&
      href.includes("/assets/")
    ) {
      // Note: currently even when the wiki link is fully vault qualified as example
      // of [[dendron://assets/note-in-asset-vault]] When it is clicked within the preview
      // the href will look along the lines of:
      // `vscode-webview://72db5b4c-61f8-400b-808c-771184cb3d7f/r68Zw7OChUZWvbD10qqmY`
      // href will contain the id of the note but it will NOT contain the vault
      // hence we should avoid the issue of parsing 'assets' vault name even if someone names their
      // vault 'assets'.
      return LinkType.ASSET;
    } else if (href && href.startsWith("vscode-webview")) {
      return LinkType.WIKI;
    } else if (
      href &&
      (href.startsWith("http://") || href.startsWith("https://"))
    ) {
      return LinkType.WEBSITE;
    } else {
      return LinkType.UNKNOWN;
    }
  }

  private static updateForNote(note: NoteProps) {
    if (PreviewPanelFactory._panel) {
      PreviewPanelFactory._panel.webview.postMessage({
        type: DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
        data: {
          note,
          syncChangedNote: true,
        },
        source: "vscode",
      } as OnDidChangeActiveTextEditorMsg);
    }
  }

  static getProxy(): PreviewProxy {
    return {
      showPreviewAndUpdate(note) {
        const ctx = {
          ctx: "ShowPreview:showPreviewAndRefresh",
          fname: note.fname,
        };
        const config = getDWorkspace().config;

        // If preview panel does not exist and automaticallyShowPreview = true, show preview before updating
        // Otherwise, update if panel exists
        if (
          !PreviewPanelFactory._panel &&
          ConfigUtils.getPreview(config).automaticallyShowPreview
        ) {
          Logger.debug({
            ...ctx,
            state: "panel not found and automaticallyShowPreview = true",
          });
          new ShowPreviewCommand(PreviewPanelFactory.create(getExtension()))
            .execute()
            .then(() => {
              PreviewPanelFactory.updateForNote(note);
            });
        } else {
          PreviewPanelFactory.updateForNote(note);
        }
      },

      getPanel() {
        return PreviewPanelFactory._panel;
      },
    };
  }

  static create(ext: DendronExtension): vscode.WebviewPanel {
    const viewColumn = vscode.ViewColumn.Beside; // Editor column to show the new webview panel in.
    const preserveFocus = true;

    if (this._panel) {
      return this._panel;
    }

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
        localResourceRoots: WebViewUtils.getLocalResourceRoots(ext.context),
      }
    );

    this._panel.webview.onDidReceiveMessage(async (msg: NoteViewMessage) => {
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
          const note = WSUtils.getActiveNote();
          if (note) {
            Logger.debug({
              ctx,
              msg: "got active note",
              note: NoteUtils.toLogObj(note),
            });
            PreviewPanelFactory.sendRefreshMessage(this._panel!, note);
          }
          break;
        }
        case NoteViewMessageEnum.onClick: {
          const { data } = msg;
          const linkType = PreviewPanelFactory.classifyLink(data);
          await handleLink({
            linkType,
            data,
            wsRoot: ext.getEngine().wsRoot,
          });
          break;
        }
        case NoteViewMessageEnum.onGetActiveEditor: {
          Logger.debug({ ctx, "msg.type": "onGetActiveEditor" });
          const activeTextEditor = VSCodeUtils.getActiveTextEditor();
          const maybeNote = !_.isUndefined(activeTextEditor)
            ? WSUtils.tryGetNoteFromDocument(activeTextEditor?.document)
            : undefined;

          if (!_.isUndefined(maybeNote)) {
            PreviewPanelFactory.sendRefreshMessage(this._panel!, maybeNote);
          }
          break;
        }
        default:
          assertUnreachable(msg.type);
      }
    });

    this._vsCodeCallback = vscode.window.onDidChangeActiveTextEditor(
      sentryReportingCallback((editor: vscode.TextEditor | undefined) => {
        if (
          !editor ||
          editor.document.uri.fsPath !==
            vscode.window.activeTextEditor?.document.uri.fsPath
        ) {
          return;
        }

        const uri = editor.document.uri;
        if (!ext.workspaceService?.isPathInWorkspace(uri.fsPath)) {
          return;
        }

        const maybeNote = WSUtils.tryGetNoteFromDocument(editor.document);

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
