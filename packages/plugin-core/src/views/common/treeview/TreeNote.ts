import {
  DNodeUtils,
  NotePropsMeta,
  TreeViewItemLabelTypeEnum,
  vault2Path,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import vscode, { Uri } from "vscode";
import { URI, Utils } from "vscode-uri";
import { DENDRON_COMMANDS } from "../../../constants";

/**
 * Contains {@link NoteProps} representing a single Tree Item inside the
 * NativeTreeView
 */
export class TreeNote extends vscode.TreeItem {
  public id: string;
  public note: NotePropsMeta;
  public uri: Uri;
  private _labelType: TreeViewItemLabelTypeEnum | undefined;

  public get labelType() {
    return this._labelType;
  }

  public set labelType(value: TreeViewItemLabelTypeEnum | undefined) {
    if (value !== this._labelType) {
      this._labelType = value;

      const label =
        this._labelType === TreeViewItemLabelTypeEnum.filename
          ? _.last(this.note.fname.split("."))
          : this.note.title;

      this.label = DNodeUtils.isRoot(this.note)
        ? `root (${VaultUtils.getName(this.note.vault)})`
        : label;
    }
  }

  constructor(
    wsRoot: URI,
    {
      note,
      collapsibleState,
      labelType,
    }: {
      note: NotePropsMeta;
      collapsibleState: vscode.TreeItemCollapsibleState;
      labelType: TreeViewItemLabelTypeEnum;
    }
  ) {
    super(DNodeUtils.basename(note.fname, true), collapsibleState);
    this.note = note;
    this.id = this.note.id;
    this.tooltip = this.note.title;
    this.contextValue = this.note.stub ? "stub" : "note";
    const vaultPath = vault2Path({
      vault: this.note.vault,
      wsRoot,
    });
    this.uri = Utils.joinPath(vaultPath, this.note.fname + ".md");

    // Invoke the setter logic during setup:
    this.labelType = labelType;

    // TODO: Need to replace with go-to note if we want parity with local ext.
    // This will not create a new note right now if you click on a 'stub' but
    // will show an error page
    if (note.stub) {
      this.command = {
        command: DENDRON_COMMANDS.TREEVIEW_EXPAND_STUB.key,
        title: "",
        arguments: [this.note.id],
      };
    } else {
      this.command = {
        command: "vscode.open",
        title: "",
        arguments: [this.uri],
      };
    }
  }
}
