import { DNodeUtils, NoteProps, VaultUtils } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
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
  }: {
    note: NoteProps;
    collapsibleState: vscode.TreeItemCollapsibleState;
  }) {
    super(DNodeUtils.basename(note.fname, true), collapsibleState);
    this.note = note;
    this.id = this.note.id;
    this.tooltip = this.note.title;
    const vpath = vault2Path({
      vault: this.note.vault,
      wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
    });
    this.uri = Uri.file(path.join(vpath, this.note.fname + ".md"));
    if (DNodeUtils.isRoot(note)) {
      this.label = `root (${VaultUtils.getName(note.vault)})`;
    }
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
