import {
  asyncLoopOneAtATime,
  DendronTreeViewKey,
  NoteProps,
  NoteUtils,
  TimeUtils,
  TreeViewItemLabelTypeEnum,
  VaultUtils,
} from "@dendronhq/common-all";
import { WorkspaceUtils } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import { Disposable, TextEditor, TreeView, window } from "vscode";
import { ExtensionProvider } from "../ExtensionProvider";
import { EngineNoteProvider } from "./EngineNoteProvider";
import { TreeNote } from "./TreeNote";

/**
 * Class managing the vscode native version of the Dendron tree view - this is
 * the side panel UI that gives a tree view of the Dendron note hierarchy
 */
export class NativeTreeView implements Disposable {
  private treeView: TreeView<NoteProps> | undefined;
  private _handler: Disposable | undefined;
  private _createDataProvider: () => EngineNoteProvider;
  private _provider: EngineNoteProvider | undefined;
  private _updateLabelTypeHandler:
    | ((opts: {
        labelType: TreeViewItemLabelTypeEnum;
        noRefresh?: boolean;
      }) => void)
    | undefined;
  private _getExpandableTreeItemsHandler: (() => TreeNote[]) | undefined;

  constructor(treeDataProviderFactory: () => EngineNoteProvider) {
    this._createDataProvider = treeDataProviderFactory;
  }

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
    const treeDataProvider = this._createDataProvider();
    this._provider = treeDataProvider;
    this._updateLabelTypeHandler = _.bind(
      treeDataProvider.updateLabelType,
      treeDataProvider
    );
    this._getExpandableTreeItemsHandler = _.bind(
      treeDataProvider.getExpandableTreeItems,
      treeDataProvider
    );
    const result = treeDataProvider.getChildren() as Promise<
      NoteProps | undefined | null
    >;

    result.then(() => {
      this.treeView = window.createTreeView(DendronTreeViewKey.TREE_VIEW, {
        treeDataProvider,
        showCollapseAll: true,
      });

      this._handler = window.onDidChangeActiveTextEditor(
        this.onOpenTextDocument,
        this
      );
    });
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
          await this.treeView?.reveal(treeItem.note, {
            expand: true,
            focus: false,
            select: false,
          });
        });
      }
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
      !this.treeView.visible
    ) {
      return;
    }

    const uri = editor.document.uri;
    const basename = path.basename(uri.fsPath);
    const { wsRoot, vaults, engine } = ExtensionProvider.getDWorkspace();

    if (
      !WorkspaceUtils.isPathInWorkspace({
        vaults,
        wsRoot,
        fpath: uri.fsPath,
      })
    ) {
      return;
    }
    if (basename.endsWith(".md")) {
      const vault = VaultUtils.getVaultByFilePath({
        fsPath: uri.fsPath,
        wsRoot,
        vaults,
      });
      const fname = NoteUtils.uri2Fname(uri);

      const note = NoteUtils.getNoteByFnameFromEngine({
        fname,
        vault,
        engine,
      });

      if (note) {
        let waitForTree = true;
        setTimeout(() => {
          waitForTree = false;
        }, 500);

        // This is a hack to prevent race condition between tree view reveal
        // and tree data provider.
        // without this `reveal` is called before tree items are reconstructed,
        // causing an exception.
        // we only wait for 500ms to prevent this from running indefinitely
        // in case of a faulty engine event that leads to the tree view
        // never creating a tree item for a note.
        while (
          waitForTree &&
          !_.keys(this._provider.getTree()).includes(note.id)
        ) {
          // eslint-disable-next-line no-await-in-loop
          await TimeUtils.sleep(10);
        }
        this.treeView.reveal(note);
      }
    }
  }
}
