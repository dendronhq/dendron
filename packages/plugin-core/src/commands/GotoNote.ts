import {
  DendronError,
  DNodeTypeV2,
  DNoteAnchor,
  DVault,
  NotePropsV2,
  NoteUtilsV2,
} from "@dendronhq/common-all";
import { Heading, ParserUtilsV2 } from "@dendronhq/engine-server";
import _ from "lodash";
import { Position, Selection, Uri, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { getSlugger } from "../utils/strings";
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
  static key = DENDRON_COMMANDS.GOTO_NOTE.key;
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
        const anchorSlug = getSlugger().slug(opts.anchor.value);
        const text = editor.document.getText();
        // TODO: optimize by doing this on startup
        const headers = ParserUtilsV2.findHeaders(text);
        const headerMatch: Heading | undefined = _.find(headers, (h) => {
          return (
            getSlugger().slug(h.children[0].value as string) === anchorSlug
          );
        });
        // const re = new RegExp(`^#+ ${opts.anchor.value}`, "mi");
        // const needleIndex = re.exec(text);
        if (headerMatch) {
          const line = (headerMatch.position?.start.line as number) - 1;
          const pos = new Position(line, 0);
          // const newPosition = editor.document.positionAt(needleIndex.index);
          editor.selection = new Selection(pos, pos);
          editor.revealRange(editor.selection);
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
