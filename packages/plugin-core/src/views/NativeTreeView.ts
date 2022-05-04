import {
  asyncLoopOneAtATime,
  ConfigUtils,
  DendronError,
  DendronTreeViewKey,
  NoteProps,
  NoteUtils,
  TreeItemLabelTypeEnum,
  VaultUtils,
} from "@dendronhq/common-all";
import {
  DConfig,
  MetadataService,
  WorkspaceUtils,
} from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import {
  Disposable,
  TextEditor,
  TreeView,
  Uri,
  ViewColumn,
  window,
} from "vscode";
import { ExtensionProvider } from "../ExtensionProvider";
import { VSCodeUtils } from "../vsCodeUtils";
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
  private _updateLabelTypeHandler:
    | ((opts: {
        labelType: TreeItemLabelTypeEnum;
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

  public updateLabelType(opts: { labelType: TreeItemLabelTypeEnum }) {
    const { labelType } = opts;
    if (this._updateLabelTypeHandler) {
      this._updateLabelTypeHandler(opts);
      const SET_AS_DEFAULT = "Set as default";
      const DONT_SHOW = "Don't show this again";
      const OPEN_CONFIG = "Open dendron.yml and Backup";
      const metadataService = MetadataService.instance();
      const showMsg = metadataService.getShowTreeViewUpdateLabelMsg();
      if (showMsg) {
        window
          .showInformationMessage(
            `Tree view items are now labeled with ${labelType}. Sorting order will follow the label type. This setting will only apply until you close VSCode.`,
            SET_AS_DEFAULT,
            DONT_SHOW
          )
          .then(async (resp) => {
            if (resp === SET_AS_DEFAULT) {
              const infix = "treeItemLabelType";
              try {
                const { wsRoot, config } = ExtensionProvider.getDWorkspace();
                const backupPath = await DConfig.createBackup(wsRoot, infix);
                ConfigUtils.setTreeItemLabelType(config, labelType);
                await DConfig.writeConfig({ wsRoot, config });
                window
                  .showInformationMessage(
                    `treeItemLabelType set to ${labelType}. Backup of dendron.yml created in ${backupPath}`,
                    OPEN_CONFIG
                  )
                  .then(async (resp) => {
                    if (resp === OPEN_CONFIG) {
                      const configPath = DConfig.configPath(wsRoot);
                      const configUri = Uri.file(configPath);
                      await VSCodeUtils.openFileInEditor(configUri);

                      const backupUri = Uri.file(backupPath);
                      await VSCodeUtils.openFileInEditor(backupUri, {
                        column: ViewColumn.Beside,
                      });
                    }
                  });
              } catch (error) {
                throw new DendronError({
                  message: `Backup ${infix} failed. Failed to set default.`,
                  payload: error,
                });
              }
            } else {
              metadataService.setShowTreeViewUpdateLabelMsg(false);
            }
          });
      }
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
        this.treeView.reveal(note);
      }
    }
  }
}
