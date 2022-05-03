import {
  DNodeUtils,
  NoteProps,
  VaultUtils,
  TreeItemLabelTypeEnum,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import vscode, { Uri } from "vscode";
import { GotoNoteCommandOpts } from "../commands/GoToNoteInterface";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";

/**
 * Contains {@link NoteProps} representing a single Tree Item inside the
 * NativeTreeView
 */
export class TreeNote extends vscode.TreeItem {
  public id: string;
  public note: NoteProps;
  public uri: Uri;
  public children: string[] = [];
  public L: typeof Logger;

  constructor({
    note,
    collapsibleState,
    labelType,
  }: {
    note: NoteProps;
    collapsibleState: vscode.TreeItemCollapsibleState;
    labelType: TreeItemLabelTypeEnum;
  }) {
    super(DNodeUtils.basename(note.fname, true), collapsibleState);
    this.note = note;
    this.id = this.note.id;
    this.tooltip = this.note.title;
    const { wsRoot } = ExtensionProvider.getDWorkspace();
    const vpath = vault2Path({
      vault: this.note.vault,
      wsRoot,
    });
    this.uri = Uri.file(path.join(vpath, this.note.fname + ".md"));

    const label =
      labelType === TreeItemLabelTypeEnum.filename
        ? _.last(this.note.fname.split("."))
        : this.note.title;

    this.label = DNodeUtils.isRoot(note)
      ? `root (${VaultUtils.getName(note.vault)})`
      : label;
    this.command = {
      command: DENDRON_COMMANDS.GOTO_NOTE.key,
      title: "",
      arguments: [
        {
          qs: this.note.fname,
          mode: "note",
          vault: this.note.vault,
        } as GotoNoteCommandOpts,
      ],
    };
    this.L = Logger;
  }
}
