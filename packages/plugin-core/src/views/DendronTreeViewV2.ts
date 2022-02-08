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
import { WorkspaceUtils } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { GotoNoteCommand } from "../commands/GotoNote";
import { IDendronExtension } from "../dendronExtensionInterface";
import { Logger } from "../logger";
import { AnalyticsUtils } from "../utils/analytics";
import { VSCodeUtils } from "../vsCodeUtils";
import { WSUtils } from "../WSUtils";
import { WebViewUtils } from "./utils";

export class DendronTreeViewV2 implements vscode.WebviewViewProvider {
  public static readonly viewType = DendronTreeViewKey.TREE_VIEW_V2;

  private _view?: vscode.WebviewView;
  private _ext: IDendronExtension;

  constructor(ext: IDendronExtension) {
    this._ext = ext;

    this._ext.context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor(this.onOpenTextDocument, this)
    );

    this._ext.noteSyncService.onNoteChange((noteProps) => {
      if (this._view && this._view.visible) {
        this.refresh(noteProps);
      }
    });
  }

  async onOpenTextDocument(editor: vscode.TextEditor | undefined) {
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
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
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
          const note = WSUtils.getActiveNote();
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

  public refresh(note: NoteProps) {
    if (this._view) {
      this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
      this._view.webview.postMessage({
        type: DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
        data: {
          note,
          syncChangedNote: true,
        },
        source: "vscode",
      } as OnDidChangeActiveTextEditorMsg);
    }
  }
}
