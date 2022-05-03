import {
  ConfigUtils,
  DendronError,
  DNodeUtils,
  NoteProps,
  NotePropsDict,
  NoteUtils,
  TreeUtils,
  TreeItemLabelTypeEnum,
} from "@dendronhq/common-all";
import { EngineEventEmitter } from "@dendronhq/engine-server";
import * as Sentry from "@sentry/node";
import _ from "lodash";
import {
  Disposable,
  Event,
  EventEmitter,
  ProviderResult,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  window,
} from "vscode";
import { DendronContext, ICONS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";
import { TreeNote } from "./TreeNote";

/**
 * Provides engine event data to generate the views for the native Tree View
 */
export class EngineNoteProvider
  implements TreeDataProvider<NoteProps>, Disposable
{
  private _onDidChangeTreeDataEmitter: EventEmitter<
    NoteProps | undefined | void
  >;
  private _onEngineNoteStateChangedDisposable: Disposable;
  private _tree: { [key: string]: TreeNote } = {};
  private _engineEvents;
  private _labelType: TreeItemLabelTypeEnum;
  /**
   * Signals to vscode UI engine that the tree view needs to be refreshed.
   */
  readonly onDidChangeTreeData: Event<NoteProps | undefined | void>;

  /**
   *
   * @param engineEvents - specifies when note state has been changed on the
   * engine
   */
  constructor(engineEvents: EngineEventEmitter) {
    this._onDidChangeTreeDataEmitter = new EventEmitter<
      NoteProps | undefined | void
    >();

    this.onDidChangeTreeData = this._onDidChangeTreeDataEmitter.event;
    this._engineEvents = engineEvents;
    this._onEngineNoteStateChangedDisposable = this.setupSubscriptions();
    const { config } = ExtensionProvider.getDWorkspace();
    this._labelType = ConfigUtils.getTreeItemLabelType(config);
    VSCodeUtils.setContextStringValue(
      DendronContext.TREEVIEW_TREE_ITEM_LABEL_TYPE,
      this._labelType
    );
  }

  dispose(): void {
    if (this._onDidChangeTreeDataEmitter) {
      this._onDidChangeTreeDataEmitter.dispose();
    }
    if (this._onEngineNoteStateChangedDisposable) {
      this._onEngineNoteStateChangedDisposable.dispose();
    }
  }

  getTreeItem(noteProps: NoteProps): TreeItem {
    try {
      return this._tree[noteProps.id];
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  public getExpandableTreeItems(): TreeItem[] {
    const candidateItems = _.toArray(
      _.pickBy(this._tree, (item) => {
        const isCollapsed =
          item.collapsibleState === TreeItemCollapsibleState.Collapsed;
        const isShallow = DNodeUtils.getDepth(item.note) < 3;
        return isCollapsed && isShallow;
      })
    );
    return _.sortBy(candidateItems, (item) => {
      return DNodeUtils.getDepth(item.note);
    });
  }

  getChildren(noteProps?: NoteProps): ProviderResult<NoteProps[]> {
    try {
      const ctx = "TreeView:getChildren";
      Logger.debug({ ctx, id: noteProps });
      const { engine } = ExtensionProvider.getDWorkspace();
      const roots = _.filter(_.values(engine.notes), DNodeUtils.isRoot);
      if (!roots) {
        window.showInformationMessage("No notes found");
        return Promise.resolve([]);
      }
      if (noteProps) {
        const childrenIds = TreeUtils.sortNotesAtLevel({
          noteIds: noteProps.children,
          noteDict: engine.notes,
          labelType: this._labelType,
        });

        const childrenNoteProps = childrenIds.map((id) => {
          return engine.notes[id];
        });

        return Promise.resolve(childrenNoteProps);
      } else {
        Logger.info({ ctx, msg: "reconstructing tree: enter" });
        const out = Promise.all(
          roots.flatMap(async (root) => {
            const treeNote = await this.parseTree(root, engine.notes);
            return treeNote.note;
          })
        );
        Logger.info({ ctx, msg: "reconstructing tree: exit" });
        return out;
      }
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  getParent(id: NoteProps): ProviderResult<NoteProps> {
    try {
      const { engine: client } = ExtensionProvider.getDWorkspace();

      const maybeParent = client.notes[id.parent || ""];
      return maybeParent || null;
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  private setupSubscriptions(): Disposable {
    return this._engineEvents.onEngineNoteStateChanged(() => {
      this.refreshTreeView();
    });
  }

  public updateLabelType(opts: {
    labelType: TreeItemLabelTypeEnum;
    noRefresh?: boolean;
  }) {
    const { labelType, noRefresh } = opts;
    this._labelType = labelType;

    VSCodeUtils.setContextStringValue(
      DendronContext.TREEVIEW_TREE_ITEM_LABEL_TYPE,
      labelType
    );
    if (!noRefresh) {
      this.refreshTreeView();
    }
  }

  /**
   * Tells VSCode to refresh the tree view. Debounced to fire every 250 ms
   */
  private refreshTreeView = _.debounce(() => {
    this._onDidChangeTreeDataEmitter.fire();
  }, 250);

  private createTreeNote(note: NoteProps) {
    const collapsibleState = _.isEmpty(note.children)
      ? TreeItemCollapsibleState.None
      : TreeItemCollapsibleState.Collapsed;

    const tn = new TreeNote({
      note,
      collapsibleState,
      labelType: this._labelType,
    });
    if (note.stub) {
      tn.iconPath = new ThemeIcon(ICONS.STUB);
    } else if (note.schema) {
      tn.iconPath = new ThemeIcon(ICONS.SCHEMA);
    }
    return tn;
  }

  private async parseTree(
    note: NoteProps,
    ndict: NotePropsDict
  ): Promise<TreeNote> {
    const ctx = "parseTree";
    const tn = this.createTreeNote(note);
    this._tree[note.id] = tn;

    const labelType = this._labelType;

    const children = TreeUtils.sortNotesAtLevel({
      noteIds: note.children,
      noteDict: ndict,
      labelType,
    });
    tn.children = await Promise.all(
      children.map(async (c) => {
        const childNote = ndict[c];
        if (!childNote) {
          const payload = {
            msg: `no childNote found: ${c}, current note: ${note.id}`,
            fullDump: _.values(ndict).map((n) => NoteUtils.toLogObj(n)),
          };
          const err = new DendronError({
            message: "error updating tree view",
            payload,
          });
          Logger.error({ ctx, error: err });
          throw err;
        }
        return (await this.parseTree(childNote, ndict)).id;
      })
    );
    return tn;
  }
}
