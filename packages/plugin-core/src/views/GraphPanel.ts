import {
  ConfigUtils,
  DendronTreeViewKey,
  DMessage,
  DMessageEnum,
  DMessageSource,
  GraphEvents,
  GraphViewMessage,
  GraphViewMessageEnum,
  NoteProps,
  NoteUtils,
  OnDidChangeActiveTextEditorMsg,
} from "@dendronhq/common-all";
import { MetadataService, WorkspaceUtils } from "@dendronhq/engine-server";
import _ from "lodash";
import * as vscode from "vscode";
import { GotoNoteCommand } from "../commands/GotoNote";
import { DendronContext } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { Logger } from "../logger";
import { GraphStyleService } from "../styles";
import { AnalyticsUtils } from "../utils/analytics";
import { VSCodeUtils } from "../vsCodeUtils";
import { WebViewUtils } from "./utils";

export class GraphPanel implements vscode.WebviewViewProvider {
  public static readonly viewType = DendronTreeViewKey.GRAPH_PANEL;
  private _view?: vscode.WebviewView;
  private _ext: IDendronExtension;
  private _graphDepth: number | undefined;
  private _showBacklinks: boolean | undefined;
  private _showOutwardLinks: boolean | undefined;

  constructor(extension: IDendronExtension) {
    this._ext = extension;
    this._ext.context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor(this.onOpenTextDocument, this)
    );
    // Set default
    this.showBacklinks =
      MetadataService.instance().graphPanelShowBacklinks ?? true;

    this.showOutwardLinks =
      MetadataService.instance().graphPanelShowOutwardLinks ?? true;

    this._graphDepth = 1;
  }

  private get graphDepth(): number | undefined {
    return this._graphDepth;
  }

  private set graphDepth(depth: number | undefined) {
    if (depth) {
      this._graphDepth = depth;
      this.postMessage({
        type: GraphViewMessageEnum.onGraphDepthChange,
        data: {
          graphDepth: this._graphDepth,
        },
        source: DMessageSource.vscode,
      });
    }
  }

  public get showBacklinks(): boolean | undefined {
    return this._showBacklinks;
  }

  public set showBacklinks(displayBacklinks: boolean | undefined) {
    if (
      !_.isUndefined(displayBacklinks) &&
      this._showBacklinks !== displayBacklinks
    ) {
      this._showBacklinks = displayBacklinks;
      VSCodeUtils.setContext(
        DendronContext.GRAPH_PANEL_SHOW_BACKLINKS,
        displayBacklinks
      );
      this.postMessage({
        type: GraphViewMessageEnum.toggleLinkedEdges,
        data: {
          showBacklinks: this._showBacklinks,
        },
        source: DMessageSource.vscode,
      });
      // Save the setting update into persistance storage:
      MetadataService.instance().graphPanelShowBacklinks = displayBacklinks;
    }
  }

  public get showOutwardLinks(): boolean | undefined {
    return this._showOutwardLinks;
  }

  public set showOutwardLinks(displayOutwardLinks: boolean | undefined) {
    if (
      !_.isUndefined(displayOutwardLinks) &&
      this._showOutwardLinks !== displayOutwardLinks
    ) {
      this._showOutwardLinks = displayOutwardLinks;
      VSCodeUtils.setContext(
        DendronContext.GRAPH_PANEL_SHOW_OUTWARD_LINKS,
        displayOutwardLinks
      );
      this.postMessage({
        type: GraphViewMessageEnum.toggleLinkedEdges,
        data: {
          showOutwardLinks: this._showOutwardLinks,
        },
        source: DMessageSource.vscode,
      });
      // Save the setting update into persistance storage:
      MetadataService.instance().graphPanelShowOutwardLinks =
        displayOutwardLinks;
    }
  }

  private postMessage(msg: DMessage) {
    if (this._view) this._view.webview.postMessage(msg);
  }

  public increaseGraphDepth() {
    if (this._view && this.graphDepth && this.graphDepth < 3) {
      this.graphDepth += 1;
    }
  }

  public decreaseGraphDepth() {
    if (this.graphDepth && this.graphDepth > 1) {
      this.graphDepth -= 1;
    }
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext<unknown>,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    await WebViewUtils.prepareTreeView({
      ext: this._ext,
      key: DendronTreeViewKey.GRAPH_PANEL,
      webviewView,
    });
    webviewView.webview.onDidReceiveMessage(
      this.onDidReceiveMessageHandler,
      this
    );

    webviewView.onDidChangeVisibility(() => {
      if (this.graphDepth && !webviewView.visible) {
        MetadataService.instance().graphDepth = this.graphDepth;
        AnalyticsUtils.track(GraphEvents.GraphPanelUsed, {
          type: "DepthChanged",
          state: this.graphDepth,
        });
      }
      AnalyticsUtils.track(GraphEvents.GraphPanelUsed, {
        type: "VisibilityChanged",
        state: webviewView.visible ? "Visible" : "Collapsed",
      });
    });
  }
  async onDidReceiveMessageHandler(msg: GraphViewMessage) {
    const ctx = "GraphPanel(side):onDidReceiveMessage";
    Logger.info({ ctx, data: msg });
    const createStub = ConfigUtils.getWorkspace(
      this._ext.getDWorkspace().config
    ).graph.createStub;
    switch (msg.type) {
      case GraphViewMessageEnum.onSelect: {
        const note = this._ext.getEngine().notes[msg.data.id];
        if (note.stub && !createStub) {
          this.refresh(note, createStub);
        } else {
          if (this._ext.wsUtils.getActiveNote()?.fname === note.fname) {
            this.refresh(note);
            break;
          }
          await new GotoNoteCommand(this._ext).execute({
            qs: note.fname,
            vault: note.vault,
          });
        }
        AnalyticsUtils.track(GraphEvents.GraphPanelUsed, {
          type: "NodeClicked",
        });
        break;
      }
      case GraphViewMessageEnum.onGetActiveEditor: {
        const editor = VSCodeUtils.getActiveTextEditor();
        this.onOpenTextDocument(editor);
        break;
      }
      case DMessageEnum.MESSAGE_DISPATCHER_READY: {
        // if ready, get current note
        const note = this._ext.wsUtils.getActiveNote();
        if (note) {
          Logger.debug({
            ctx,
            msg: "got active note",
            note: NoteUtils.toLogObj(note),
          });
        }
        if (note) {
          this.refresh(note);
        }
        break;
      }
      case GraphViewMessageEnum.onRequestGraphOpts: {
        // Set graph styles
        const styles = GraphStyleService.getParsedStyles();
        const graphTheme = MetadataService.instance().getGraphTheme();
        this.graphDepth = MetadataService.instance().graphDepth;
        if (
          this._view &&
          (styles ||
            graphTheme ||
            this.graphDepth ||
            this.showBacklinks ||
            this.showOutwardLinks)
        ) {
          this._view.webview.postMessage({
            type: GraphViewMessageEnum.onGraphLoad,
            data: {
              styles,
              graphTheme,
              graphDepth: this.graphDepth,
              showBacklinks: this.showBacklinks,
              showOutwardLinks: this.showOutwardLinks,
            },
            source: "vscode",
          });
        }
        break;
      }
      default:
        break;
    }
  }

  async onActiveTextEditorChangeHandler() {
    const editor = VSCodeUtils.getActiveTextEditor();
    if (editor?.document) {
      this.onOpenTextDocument(editor);
    } else {
      this.refresh(); // call refresh without note so that `noteActive` gets unset.
    }
  }

  onOpenTextDocument(editor: vscode.TextEditor | undefined) {
    const document = editor?.document;
    if (_.isUndefined(document) || _.isUndefined(this._view)) {
      return;
    }
    if (!this._view.visible) {
      return;
    }
    const ctx = "GraphPanel(side):openTextDocument";
    const { wsRoot, vaults } = this._ext.getDWorkspace();
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
        ctx,
        msg: "refresh note",
        note: NoteUtils.toLogObj(note),
      });
      this.refresh(note);
    }
  }

  public refresh(note?: NoteProps, createStub?: boolean) {
    if (this._view) {
      if (note) {
        this._view.show?.(true);
      }
      this._view.webview.postMessage({
        type: DMessageEnum.ON_DID_CHANGE_ACTIVE_TEXT_EDITOR,
        data: {
          note,
          syncChangedNote: true,
          activeNote:
            note?.stub && !createStub
              ? note
              : this._ext.wsUtils.getActiveNote(),
        },
        source: "vscode",
      } as OnDidChangeActiveTextEditorMsg);
    }
  }
}
