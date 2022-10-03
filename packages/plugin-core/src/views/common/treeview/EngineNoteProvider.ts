import {
  EngineEventEmitter,
  type ReducedDEngine,
  NotePropsMeta,
  TAGS_HIERARCHY_BASE,
  TreeViewItemLabelTypeEnum,
} from "@dendronhq/common-all";
import _ from "lodash";
import { inject, injectable } from "tsyringe";
import * as vscode from "vscode";
import {
  Disposable,
  Event,
  EventEmitter,
  ProviderResult,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
} from "vscode";
import { URI } from "vscode-uri";
import { ICONS } from "../../../constants";
import { type ITreeViewConfig } from "./ITreeViewConfig";
import { TreeNote } from "./TreeNote";

/**
 * Provides engine event data to generate the views for the native Tree View
 */
@injectable()
export class EngineNoteProvider
  implements TreeDataProvider<string>, Disposable
{
  private _onDidChangeTreeDataEmitter: EventEmitter<string | undefined | void>;
  private _onEngineNoteStateChangedDisposable: Disposable;
  private _tree: { [key: string]: TreeNote } = {};
  /**
   * Signals to vscode UI engine that the tree view needs to be refreshed.
   */
  readonly onDidChangeTreeData: Event<string | undefined | void>;

  private setLabelContext(labelType: TreeViewItemLabelTypeEnum) {
    vscode.commands.executeCommand(
      "setContext",
      "dendron:treeviewItemLabelType",
      labelType
    );
  }
  /**
   *
   * @param engineEvents - specifies when note state has been changed on the
   * engine
   */
  constructor(
    @inject("wsRoot") private wsRoot: URI,
    @inject("ReducedDEngine")
    private engine: ReducedDEngine,
    @inject("EngineEventEmitter") private _engineEvents: EngineEventEmitter,
    @inject("ITreeViewConfig") private _treeViewConfig: ITreeViewConfig
  ) {
    this._onDidChangeTreeDataEmitter = new EventEmitter<
      string | undefined | void
    >();

    this.onDidChangeTreeData = this._onDidChangeTreeDataEmitter.event;
    this._onEngineNoteStateChangedDisposable = this.setupSubscriptions();

    this.setLabelContext(this._treeViewConfig.LabelTypeSetting);
  }

  /**
   * Changes the appearance of the labels in the tree view
   * @param opts
   * @returns
   */
  public updateLabelType(opts: { labelType: TreeViewItemLabelTypeEnum }) {
    const { labelType } = opts;
    if (labelType === this._treeViewConfig.LabelTypeSetting) {
      return;
    }

    this._treeViewConfig.LabelTypeSetting = labelType;
    this.setLabelContext(labelType);

    Object.values(this._tree).forEach((treeNote) => {
      treeNote.labelType = labelType;
    });

    // Fire on the root note to make all labels update
    this._onDidChangeTreeDataEmitter.fire();
  }

  /**
   * This method should be called prior to calling treeView.reveal(noteId) -
   * this is to ensure that the ancestral chain is present in the tree view's
   * node cache so that the targeted node can be properly revealed in the tree.
   * @param noteId
   */
  public async prepNodeForReveal(noteId: string) {
    if (!this._tree[noteId]) {
      this._tree[noteId] = await this.createTreeNote(noteId);
    }

    let curNode = this._tree[noteId];

    while (curNode.note.parent && !this._tree[curNode.note.parent]) {
      // eslint-disable-next-line no-await-in-loop
      await this.addParentOfNoteToCache(curNode.note);

      curNode = this._tree[curNode.note.parent];
    }
  }

  getParent(noteId: string): ProviderResult<string> {
    if (this._tree[noteId]) {
      const parentId = this._tree[noteId].note.parent;

      if (!parentId) {
        return;
      }

      return new Promise((resolve) => {
        this.addParentOfNoteToCache(this._tree[noteId].note).then(() => {
          resolve(parentId);
        });
      });
    }
    throw new Error(`Unable to getParent for ${noteId}`);
  }

  getChildren(noteId?: string): ProviderResult<string[]> {
    return new Promise<string[]>((resolve) => {
      if (noteId) {
        // Need to pre-fetch so it's available in the cache immediately upon render request.
        // TODO: use bulk get
        if (this._tree[noteId]) {
          this.addChildrenOfNoteToCache(this._tree[noteId].note).then(
            (children) => {
              const sortedChildren = this.sortNotesAtLevel({
                noteMeta: children,
                labelType: this._treeViewConfig.LabelTypeSetting,
              }).map((metaProps) => metaProps.id);

              resolve(sortedChildren);
            }
          );
          return;
        }

        this.createTreeNote(noteId).then((treeNote) => {
          this.addChildrenOfNoteToCache(treeNote.note).then((children) => {
            const sortedChildren = this.sortNotesAtLevel({
              noteMeta: children,
              labelType: this._treeViewConfig.LabelTypeSetting,
            }).map((metaProps) => metaProps.id);

            resolve(sortedChildren);
          });
        });

        return;
      } else {
        this.engine.findNotesMeta({ fname: "root" }).then((values) => {
          const all = Promise.all(
            values.map(async (noteProps) => {
              this._tree[noteProps.id] = await this.createTreeNoteFromProps(
                noteProps
              );
              return noteProps.id;
            })
          );

          all.then((value) => {
            return resolve(value);
          });
        });
      }
    });
  }

  getTreeItem(noteProps: string): TreeItem {
    if (this._tree[noteProps]) {
      return this._tree[noteProps];
    } else {
      throw new Error(`${noteProps} not found in cache!`);
    }
  }

  dispose(): void {
    if (this._onDidChangeTreeDataEmitter) {
      this._onDidChangeTreeDataEmitter.dispose();
    }
    if (this._onEngineNoteStateChangedDisposable) {
      this._onEngineNoteStateChangedDisposable.dispose();
    }
  }

  private setupSubscriptions(): Disposable {
    return this._engineEvents.onEngineNoteStateChanged((e) => {
      e.forEach(async (noteChangeEntry) => {
        // TODO: Add Special logic to handle deletes

        this._tree[noteChangeEntry.note.id] =
          await this.createTreeNoteFromProps(noteChangeEntry.note);

        this._onDidChangeTreeDataEmitter.fire(noteChangeEntry.note.id);
      });
    });
  }

  private async addChildrenOfNoteToCache(
    noteProps: NotePropsMeta
  ): Promise<NotePropsMeta[]> {
    return Promise.all(
      noteProps.children.map(async (child) => {
        if (!this._tree[child]) {
          const props = await this.createTreeNote(child);
          this._tree[child] = props;
          return props.note;
        }

        return this._tree[child].note;
      })
    );
  }

  private async addParentOfNoteToCache(noteProps: NotePropsMeta) {
    if (!noteProps.parent) {
      return;
    }

    if (!this._tree[noteProps.parent]) {
      this._tree[noteProps.parent] = await this.createTreeNote(
        noteProps.parent
      );
    }
  }

  private async createTreeNote(noteId: string) {
    const note = await this.engine.getNoteMeta(noteId);

    if (!note || !note.data) {
      throw new Error(`Unable to find note ${note} for tree view!`);
    }

    return this.createTreeNoteFromProps(note.data);
  }

  private async createTreeNoteFromProps(note: NotePropsMeta) {
    const collapsibleState = _.isEmpty(note.children)
      ? TreeItemCollapsibleState.None
      : TreeItemCollapsibleState.Collapsed;

    const tn = new TreeNote(this.wsRoot, {
      note,
      collapsibleState,
      labelType: this._treeViewConfig.LabelTypeSetting,
    });
    if (note.stub) {
      tn.iconPath = new ThemeIcon(ICONS.STUB);
    }

    this._tree[note.id] = tn;

    return tn;
  }

  /**
   *  Derived from common-all's sortNotesAtLevel
   * @param param0
   * @returns
   */
  private sortNotesAtLevel({
    noteMeta,
    reverse,
    labelType,
  }: {
    noteMeta: NotePropsMeta[];
    reverse?: boolean;
    labelType?: TreeViewItemLabelTypeEnum;
  }): NotePropsMeta[] {
    const out = _.sortBy(
      noteMeta,
      // Sort by nav order if set
      (noteProps) => noteProps.custom?.nav_order,
      // Sort by label
      (noteProps) => {
        if (labelType) {
          return labelType === TreeViewItemLabelTypeEnum.filename
            ? _.last(noteProps.fname.split("."))?.toLowerCase()
            : noteProps.title?.toLowerCase();
        } else {
          return noteProps.title?.toLowerCase();
        }
      },
      // If titles are identical, sort by last updated date
      (noteProps) => noteProps.updated
    );
    // bubble down tags hierarchy if nav_order is not set
    const maybeTagsHierarchy = out.find(
      (noteId) => noteId.fname === TAGS_HIERARCHY_BASE
    );
    if (
      maybeTagsHierarchy &&
      maybeTagsHierarchy.custom?.nav_order === undefined
    ) {
      const idx = out.indexOf(maybeTagsHierarchy);
      out.splice(idx, 1);
      out.push(maybeTagsHierarchy);
    }
    if (reverse) {
      return _.reverse(out);
    }

    return out;
  }
}
