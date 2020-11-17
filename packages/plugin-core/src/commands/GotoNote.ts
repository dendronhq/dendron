import {
  DendronError,
  DNodeTypeV2,
  DNoteAnchor,
  DVault,
  NotePropsV2,
  NoteUtilsV2,
} from "@dendronhq/common-all";
import { Position, Selection, Uri, window } from "vscode";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {
  qs: string;
  mode: DNodeTypeV2;
  vault: DVault;
  anchor?: DNoteAnchor;
};
export { CommandOpts as GotoNoteCommandOpts };

type CommandOutput = { note: NotePropsV2; pos?: Position } | undefined;

export class GotoNoteCommand extends BasicCommand<CommandOpts, CommandOutput> {
  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const ctx = "GotoNoteCommand";
    this.L.info({ ctx, opts, msg: "enter" });
    const { qs, vault } = opts;
    let pos: undefined | Position;
    if (opts.mode === "note") {
      const client = DendronWorkspace.instance().getEngine();
      const { data } = await client.getNoteByPath({
        npath: qs,
        createIfNew: true,
        vault,
      });
      const note = data?.note as NotePropsV2;
      const npath = NoteUtilsV2.getPath({ note });
      const uri = Uri.file(npath);
      const editor = await VSCodeUtils.openFileInEditor(uri);
      this.L.info({ ctx, opts, msg: "exit" });
      if (opts.anchor && editor) {
        const text = editor.document.getText();
        const re = new RegExp(`^#+ ${opts.anchor.value}`, "mi");
        const needleIndex = re.exec(text);
        // const needleIndex = text.match(/^#+ ${opts.anchor}/mi)
        if (needleIndex && needleIndex.index) {
          const newPosition = editor.document.positionAt(needleIndex.index);
          editor.selection = new Selection(newPosition, newPosition);
          editor.revealRange(editor.selection);
          pos = newPosition;
        } else {
          window.showErrorMessage("no anchor found");
          return;
        }
      }
      return { note, pos };
    } else {
      throw new DendronError({ msg: "goto schema not implemented" });
    }
  }
}
