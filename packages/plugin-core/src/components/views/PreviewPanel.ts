import {
  assertUnreachable,
  DendronASTDest,
  DendronEditorViewKey,
  DMessageEnum,
  getWebEditorViewEntry,
  isWebUri,
  NoteProps,
  NoteUtils,
  NoteViewMessage,
  NoteViewMessageEnum,
  OnDidChangeActiveTextEditorMsg,
  memoize,
  DendronError,
  ConfigUtils,
} from "@dendronhq/common-all";
import { DConfig } from "@dendronhq/common-server";
import { WorkspaceUtils } from "@dendronhq/engine-server";
import {
  DendronASTTypes,
  Image,
  makeImageUrlFullPath,
  MDUtilsV5,
  visit,
} from "@dendronhq/unified";
import _ from "lodash";
import * as vscode from "vscode";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { Logger } from "../../logger";
import { ITextDocumentService } from "../../services/ITextDocumentService";
import { sentryReportingCallback } from "../../utils/analytics";
import { WebViewUtils } from "../../views/utils";
import { VSCodeUtils } from "../../vsCodeUtils";
import { WSUtilsV2 } from "../../WSUtilsV2";
import { IPreviewLinkHandler } from "./IPreviewLinkHandler";
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
  private _textDocumentService: ITextDocumentService;
  private _onDidChangeActiveTextEditor: vscode.Disposable | undefined =
    undefined;
  private _onTextChanged: vscode.Disposable | undefined = undefined;
  private _linkHandler: IPreviewLinkHandler;
  private _lockedEditorNoteId: string | undefined;

  /**
   *
   * @param param0 extension - IDendronExtension implementation. linkHandler -
   * Implementation to handle preview link clicked events
   */
  constructor({
    extension,
    linkHandler,
    textDocumentService,
  }: {
    extension: IDendronExtension;
    linkHandler: IPreviewLinkHandler;
    textDocumentService: ITextDocumentService;
  }) {
    this._ext = extension;
    this._linkHandler = linkHandler;
    this._textDocumentService = textDocumentService;
  }

  /**
   * Show the preview.
   * @param note - if specified, this will override the preview contents with
   * the contents specified in this parameter. Otherwise, the contents of the
   * preview will follow default behavior (it will show the currently in-focus
   * Dendron note).
   */
  async show(note?: NoteProps): Promise<void> {
    if (this._panel) {
      if (!this.isVisible()) {
        this._panel.reveal();
      }
    } else {
      const viewColumn = vscode.ViewColumn.Beside; // Editor column to show the new webview panel in.
      const preserveFocus = true;
      const port = this._ext.port!;
      const engine = this._ext.getEngine();
      const { wsRoot } = engine;

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
        if (this._onDidChangeActiveTextEditor) {
          this._onDidChangeActiveTextEditor.dispose();
          this._onDidChangeActiveTextEditor = undefined;
        }

        if (this._onTextChanged) {
          this._onTextChanged.dispose();
          this._onTextChanged = undefined;
        }

        this._panel = undefined;
        this.unlock();
      });

      this._panel.reveal(viewColumn, preserveFocus);
    }

    if (note && this.isVisible()) {
      this.sendRefreshMessage(this._panel, note, true);
    }
  }
  hide(): void {
    this.dispose();
  }
  async lock(noteId?: string) {
    if (noteId) {
      this._lockedEditorNoteId = noteId;
      this.sendLockMessage(this._panel, this.isLocked());
    } else {
      Logger.error({
        ctx: "lock preview",
        msg: "Did not find note to lock.",
      });
    }
  }
  unlock() {
    this._lockedEditorNoteId = undefined;
    this.sendLockMessage(this._panel, this.isLocked());
  }
  isOpen(): boolean {
    return this._panel !== undefined;
  }
  isVisible(): boolean {
    return this._panel !== undefined && this._panel.visible;
  }

  isLocked(): boolean {
    return this._lockedEditorNoteId !== undefined;
  }

  /**
   * If the Preview is locked and the active note does not match the locked note.
   */
  async isLockedAndDirty(): Promise<boolean> {
    const note = await this._ext.wsUtils.getActiveNote();
    return this.isLocked() && note?.id !== this._lockedEditorNoteId;
  }
  dispose() {
    this.unlock();
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
            note = await wsUtils.getActiveNote();
            if (note) {
              Logger.debug({
                ctx,
                msg: "got active note",
                note: NoteUtils.toLogObj(note),
              });
            }
          }
          if (note) {
            this.sendRefreshMessage(this._panel!, note, true);
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
            ? await this._ext.wsUtils.tryGetNoteFromDocument(
                activeTextEditor?.document
              )
            : undefined;

          if (!_.isUndefined(maybeNote)) {
            this.sendRefreshMessage(this._panel!, maybeNote, true);
          }
          break;
        }
        case NoteViewMessageEnum.onLock: {
          const { data } = msg;
          Logger.debug({ ctx, "msg.type": "onLock" });
          this.lock(data.id);
          break;
        }
        case NoteViewMessageEnum.onUnlock: {
          Logger.debug({ ctx, "msg.type": "onUnlock" });
          this.unlock();
          break;
        }
        case DMessageEnum.ON_UPDATE_PREVIEW_HTML:
          break;
        default:
          assertUnreachable(msg.type);
      }
    });

    // If the user changes focus, then the newly in-focus Dendron note should be
    // shown in the preview
    this._onDidChangeActiveTextEditor =
      vscode.window.onDidChangeActiveTextEditor(
        sentryReportingCallback(
          async (editor: vscode.TextEditor | undefined) => {
            if (
              !editor ||
              editor.document.uri.fsPath !==
                vscode.window.activeTextEditor?.document.uri.fsPath ||
              (await this.isLockedAndDirty())
            ) {
              return;
            }

            const textDocument = editor.document;
            const { wsRoot, vaults } = this._ext.getDWorkspace();
            if (
              !WorkspaceUtils.isPathInWorkspace({
                wsRoot,
                vaults,
                fpath: textDocument.uri.fsPath,
              })
            ) {
              return;
            }

            const maybeNote = await this._ext.wsUtils.tryGetNoteFromDocument(
              editor.document
            );

            if (!maybeNote) {
              return;
            }
            this.sendRefreshMessage(this._panel!, maybeNote, true);
          }
        )
      );

    // If the text document contents have changed, update the preview with the new
    // contents. This call is debounced every 200 ms
    this._onTextChanged = vscode.workspace.onDidChangeTextDocument(
      _.debounce(this.updatePreviewPanel, 200),
      this
    );

    this._ext.addDisposable(this._onDidChangeActiveTextEditor);
    this._ext.addDisposable(this._onTextChanged);
  }

  /** Rewrites the image URLs to use VSCode's webview URIs, which is required to
   * access files from the preview.
   *
   * The results of this is cached based on the note content hash, so repeated
   * calls should not be excessively expensive.
   */
  private rewriteImageUrls = memoize({
    fn: (note: NoteProps, panel: vscode.WebviewPanel) => {
      const parser = MDUtilsV5.procRemarkFull({
        noteToRender: note,
        dest: DendronASTDest.MD_DENDRON,
        fname: note.fname,
        vault: note.vault,
        config: DConfig.readConfigSync(this._ext.getDWorkspace().wsRoot, true),
        wsRoot: this._ext.getDWorkspace().wsRoot,
        vaults: this._ext.getDWorkspace().vaults,
      });
      const tree = parser.parse(note.body);
      // ^preview-rewrites-images
      visit(
        tree,
        [DendronASTTypes.IMAGE, DendronASTTypes.EXTENDED_IMAGE],
        (image: Image) => {
          if (!isWebUri(image.url)) {
            makeImageUrlFullPath({ node: image, proc: parser });
            image.url = panel.webview
              .asWebviewUri(vscode.Uri.file(image.url))
              .toString();
          }
        }
      );
      return {
        ...note,
        body: parser.stringify(tree),
      };
    },
    keyFn: (note) => note.id,
    shouldUpdate: (previous, current) =>
      previous.contentHash !== current.contentHash,
  });

  /**
   * Notify preview webview panel to display latest contents
   *
   * @param panel panel to notify
   * @param note note to display
   * @param isFullRefresh If true, sync contents of note with what's being seen in active editor.
   * This will be true in cases where user switches between tabs or opens/closes notes without saving, as contents of notes may not match engine notes.
   * Otherwise display contents of note
   */
  private async sendRefreshMessage(
    panel: vscode.WebviewPanel,
    note: NoteProps,
    isFullRefresh: boolean
  ) {
    if (this.isVisible()) {
      // Engine state has not changed so do not sync. This is for displaying updated text only
      const syncChangedNote = false;

      // If full refresh is required, sync note with contents in active text editor
      const textDocument = VSCodeUtils.getActiveTextEditor()?.document;
      if (textDocument && isFullRefresh) {
        note = await this._textDocumentService.applyTextDocumentToNoteProps(
          note,
          textDocument
        );
      }
      note = this.rewriteImageUrls(note, panel);

      try {
        return panel.webview.postMessage({
          type: DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
          data: {
            note,
            syncChangedNote,
          },
          source: "vscode",
        } as OnDidChangeActiveTextEditorMsg);
      } catch (err) {
        Logger.info({
          ctx: "sendRefreshMessage",
          state: "webview is disposed",
        });
        return;
      }
    }

    return;
  }

  private sendLockMessage(
    panel: vscode.WebviewPanel | undefined,
    isLocked: boolean
  ) {
    try {
      return panel?.webview.postMessage({
        type: isLocked
          ? NoteViewMessageEnum.onLock
          : NoteViewMessageEnum.onUnlock,
        data: {},
        source: "vscode",
      } as NoteViewMessage);
    } catch (err) {
      Logger.info({
        ctx: "sendLockMessage",
        state: "webview is disposed",
      });
      return;
    }
  }

  /**
   * If panel is visible, update preview panel with text document changes
   */
  private async updatePreviewPanel(
    textDocument: vscode.TextDocumentChangeEvent
  ) {
    if (textDocument.document.isDirty === false) {
      return;
    }
    if (this.isVisible() && !(await this.isLockedAndDirty())) {
      const note =
        await this._textDocumentService.processTextDocumentChangeEvent(
          textDocument
        );
      if (note) {
        return this.sendRefreshMessage(this._panel!, note, false);
      }
    }
    return undefined;
  }

  private initWithNote: NoteProps | undefined;

  // eslint-disable-next-line camelcase
  __DO_NOT_USE_IN_PROD_exposePropsForTesting() {
    return {
      rewriteImageUrls: (note: NoteProps) => {
        if (!this._panel)
          throw new DendronError({
            message: "Panel used before being initalized",
          });
        return this.rewriteImageUrls(note, this._panel);
      },
    };
  }
}
