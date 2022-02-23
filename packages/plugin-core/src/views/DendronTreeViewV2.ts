import {
  DendronTreeViewKey,
  DMessageEnum,
  NoteProps,
  NoteUtils,
  OnDidChangeActiveTextEditorMsg,
  TreeViewMessage,
  TreeViewMessageEnum,
  VSCodeEvents,
} from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import { EngineEventEmitter, WorkspaceUtils } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import {
  CancellationToken,
  Disposable,
  TextEditor,
  WebviewView,
  WebviewViewProvider,
  WebviewViewResolveContext,
  window,
} from "vscode";
import { GotoNoteCommand } from "../commands/GotoNote";
import { IDendronExtension } from "../dendronExtensionInterface";
import { Logger } from "../logger";
import { AnalyticsUtils } from "../utils/analytics";
import { VSCodeUtils } from "../vsCodeUtils";
import { WebViewUtils } from "./utils";

/**
 * Class managing the webview version of the Dendron tree view (currently called
 * TreeViewV2) - this is the side panel UI that gives the webview/react/antd
 * based tree view of the Dendron note hierarchy
 */
export class DendronTreeViewV2 implements WebviewViewProvider, Disposable {
  public static readonly viewType = DendronTreeViewKey.TREE_VIEW_V2;

  private _view?: WebviewView;
  private _ext: IDendronExtension;
  private _onEngineNoteStateChangedDisposable: Disposable | undefined;
  private _engineEvents;

  /**
   *
   * @param engineEvents - specifies when note state has been changed on the
   * engine
   */
  constructor(ext: IDendronExtension, engineEvents: EngineEventEmitter) {
    this._ext = ext;
    this._engineEvents = engineEvents;

    this._ext.context.subscriptions.push(
      window.onDidChangeActiveTextEditor(this.onOpenTextDocument, this)
    );

    this._onEngineNoteStateChangedDisposable =
      this._engineEvents.onEngineNoteStateChanged((noteChangeEntry) => {
        const ctx = "refreshDendronTreeViewV2EngineNoteStateChanged";
        Logger.info({ ctx });
        noteChangeEntry.map((changeEntry) => this.refresh(changeEntry.note));
      });
  }
  dispose(): void {
    if (this._onEngineNoteStateChangedDisposable) {
      this._onEngineNoteStateChangedDisposable.dispose();
    }
  }

  async onOpenTextDocument(editor: TextEditor | undefined) {
    if (_.isUndefined(editor) || _.isUndefined(this._view)) {
      return;
    }
    if (!this._view.visible) {
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

  public async resolveWebviewView(
    webviewView: WebviewView,
    _context: WebviewViewResolveContext,
    _token: CancellationToken
  ) {
    const ctx = "DendronTreeViewV2:resolveWebView";
    this._view = webviewView;
    const start = process.hrtime();
    Logger.info({ ctx, msg: "enter", start });

    WebViewUtils.prepareTreeView({
      ext: this._ext,
      key: DendronTreeViewKey.TREE_VIEW_V2,
      webviewView,
    });

    const duration = getDurationMilliseconds(start);
    Logger.info({ ctx, msg: "genHtml:post", duration });
    webviewView.webview.onDidReceiveMessage(async (msg: TreeViewMessage) => {
      Logger.info({ ctx: "onDidReceiveMessage", data: msg });
      switch (msg.type) {
        case TreeViewMessageEnum.onSelect: {
          const note = this._ext.getEngine().notes[msg.data.id];
          await new GotoNoteCommand(this._ext).execute({
            qs: note.fname,
            vault: note.vault,
          });
          break;
        }
        case TreeViewMessageEnum.onGetActiveEditor: {
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
        case DMessageEnum.MESSAGE_DISPATCHER_READY: {
          const profile = getDurationMilliseconds(start);
          Logger.info({ ctx, msg: "treeViewLoaded", profile, start });
          AnalyticsUtils.track(VSCodeEvents.TreeView_Ready, {
            duration: profile,
          });
          const note = this._ext.wsUtils.getActiveNote();
          if (note) {
            this.refresh(note);
          }
          break;
        }
        default:
          break;
      }
    });
  }

  /**
   * Notify webview to sync given note and to focus on active note
   * @param note to sync
   */
  private refresh(note: NoteProps) {
    if (this._view) {
      this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
      this._view.webview.postMessage({
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
}
