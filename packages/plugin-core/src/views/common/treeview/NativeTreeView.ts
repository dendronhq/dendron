import "reflect-metadata";
import {
  asyncLoopOneAtATime,
  DendronTreeViewKey,
  TreeViewItemLabelTypeEnum,
} from "@dendronhq/common-all";
import _ from "lodash";
import { injectable } from "tsyringe";
import { Disposable, TextEditor, TreeView, window } from "vscode";
import { EngineNoteProvider } from "./EngineNoteProvider";
import { TreeNote } from "./TreeNote";
import * as vscode from "vscode";
import { WSUtilsWeb } from "../../../web/utils/WSUtils";
/**
 * Class managing the vscode native version of the Dendron tree view - this is
 * the side panel UI that gives a tree view of the Dendron note hierarchy
 */
@injectable()
export class NativeTreeView implements Disposable {
  private treeView: TreeView<string> | undefined;
  private _handler: Disposable | undefined;
  private _updateLabelTypeHandler:
    | ((opts: {
        labelType: TreeViewItemLabelTypeEnum;
        noRefresh?: boolean;
      }) => void)
    | undefined;
  private _getExpandableTreeItemsHandler: (() => TreeNote[]) | undefined;

  constructor(
    private _provider: EngineNoteProvider,
    private wsUtils: WSUtilsWeb
  ) {}

  dispose() {
    if (this._handler) {
      this._handler.dispose();
      this._handler = undefined;
    }

    if (this.treeView) {
      this.treeView.dispose();
      this.treeView = undefined;
    }
  }

  /**
   * Creates the Tree View and shows it in the UI (registers with vscode.window)
   */
  async show() {
    this._updateLabelTypeHandler = _.bind(
      this._provider.updateLabelType,
      this._provider
    );

    this.treeView = window.createTreeView(DendronTreeViewKey.TREE_VIEW, {
      treeDataProvider: this._provider,
      showCollapseAll: true,
    });

    this.treeView.onDidChangeVisibility((e) => {
      if (e.visible) {
        this.onOpenTextDocument(vscode.window.activeTextEditor);
      }
    });

    this._handler = window.onDidChangeActiveTextEditor(
      this.onOpenTextDocument,
      this
    );
  }

  public updateLabelType(opts: { labelType: TreeViewItemLabelTypeEnum }) {
    if (this._updateLabelTypeHandler) {
      this._updateLabelTypeHandler(opts);
    }
  }

  public async expandAll() {
    if (this._getExpandableTreeItemsHandler) {
      const expandableTreeItems = this._getExpandableTreeItemsHandler();
      if (this.treeView) {
        await asyncLoopOneAtATime(expandableTreeItems, async (treeItem) => {
          await this._provider.prepNodeForReveal(treeItem.note.id);
          await this.treeView?.reveal(treeItem.note.id, {
            expand: true,
            focus: false,
            select: false,
          });
        });
      }
    }
  }

  public async expandTreeItem(id: string) {
    if (this.treeView) {
      await this.treeView?.reveal(id, {
        expand: true,
        focus: false,
        select: false,
      });
    }
  }

  /**
   * Whenever a new note is opened, we move the tree view focus to the newly
   * opened note.
   * @param editor
   * @returns
   */
  private async onOpenTextDocument(editor: TextEditor | undefined) {
    if (
      _.isUndefined(editor) ||
      _.isUndefined(this.treeView) ||
      _.isUndefined(this._provider) ||
      !this.treeView ||
      !this.treeView.visible
    ) {
      return;
    }

    const doc = editor.document;

    if (!doc.fileName.endsWith("md")) {
      return;
    }

    const note = await this.wsUtils.getNoteFromDocument(doc);

    if (note && note.length > 0) {
      await this._provider.prepNodeForReveal(note[0].id);
      this.treeView.reveal(note[0].id, { focus: false, expand: 3 });
    }
  }
}
