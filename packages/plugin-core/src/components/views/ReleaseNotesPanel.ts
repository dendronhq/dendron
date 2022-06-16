import {
  ConfigUtils,
  DendronEditorViewKey,
  DMessageEnum,
  getWebEditorViewEntry,
  NoteProps,
  NoteViewMessage,
  NoteViewMessageEnum,
  OnDidChangeActiveTextEditorMsg,
} from "@dendronhq/common-all";
import * as vscode from "vscode";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { Logger } from "../../logger";
import { WebViewUtils } from "../../views/utils";
import { IPreviewLinkHandler } from "./PreviewLinkHandler";
import { PreviewProxy } from "./PreviewProxy";

/**
 * An implementation of PreviewProxy specific for displaying Release Notes in a
 * webview. This is a stripped down version of PreviewPanel that only displays
 * an unchanging page.
 */
export class ReleaseNotesPanel implements PreviewProxy, vscode.Disposable {
  private _ext: IDendronExtension;
  private _panel: vscode.WebviewPanel | undefined;
  private _linkHandler: IPreviewLinkHandler;

  private _note: NoteProps | undefined;

  constructor({
    extension,
    linkHandler,
  }: {
    extension: IDendronExtension;
    linkHandler: IPreviewLinkHandler;
  }) {
    this._ext = extension;
    this._linkHandler = linkHandler;
  }

  /**
   * Show the specified release note page.
   */
  async show(note: NoteProps): Promise<void> {
    this._note = note;

    if (this._panel) {
      if (!this.isVisible()) {
        this._panel.reveal();
      }
    } else {
      const viewColumn = vscode.ViewColumn.One;
      const preserveFocus = true;
      const port = this._ext.port!;
      const engine = this._ext.getEngine();
      const { wsRoot } = engine;

      const { bundleName: name, label } = getWebEditorViewEntry(
        DendronEditorViewKey.RELEASE_NOTES
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
          enableCommandUris: true,
          retainContextWhenHidden: true,
          enableFindWidget: true,
          localResourceRoots: WebViewUtils.getLocalResourceRoots(
            this._ext.context
          ).concat(vscode.Uri.file(wsRoot)),
        }
      );

      const webViewAssets = WebViewUtils.getJsAndCss();
      const initialTheme =
        ConfigUtils.getPreview(this._ext.getDWorkspace().config).theme || "";
      const html = await WebViewUtils.getWebviewContent({
        ...webViewAssets,
        name,
        port,
        wsRoot,
        panel: this._panel,
        initialTheme,
      });

      this._panel.webview.html = html;

      this.setupCallbacks();

      this._panel.onDidDispose(() => {
        this._panel = undefined;
      });

      this._panel.reveal(viewColumn, preserveFocus);
    }

    if (this.isVisible()) {
      this.sendRefreshMessage(this._panel, note);
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
    // Callback on getting a message back from the webview
    this._panel!.webview.onDidReceiveMessage(async (msg: NoteViewMessage) => {
      const ctx = "ShowPreview:onDidReceiveMessage";
      Logger.debug({ ctx, msgType: msg.type });
      switch (msg.type) {
        case DMessageEnum.MESSAGE_DISPATCHER_READY: {
          if (this._note) {
            this.sendRefreshMessage(this._panel!, this._note);
          }
          break;
        }
        case NoteViewMessageEnum.onClick: {
          const { data } = msg;
          this._linkHandler.onLinkClicked({ data });
          break;
        }

        default:
          break;
      }
    });
  }

  private async sendRefreshMessage(
    panel: vscode.WebviewPanel,
    note: NoteProps
  ) {
    if (this.isVisible()) {
      // This page is static.  Don't do any syncing.
      const syncChangedNote = false;

      return panel.webview.postMessage({
        type: DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
        data: {
          note,
          syncChangedNote,
        },
        source: "vscode",
      } as OnDidChangeActiveTextEditorMsg);
    }
    return;
  }
}
