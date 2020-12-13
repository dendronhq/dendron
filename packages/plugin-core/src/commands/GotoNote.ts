import {
  DendronError,
  DNodeTypeV2,
  DNoteAnchor,
  DVault,
  getSlugger,
  NotePropsV2,
  NoteUtilsV2,
} from "@dendronhq/common-all";
import { Heading, ParserUtilsV2 } from "@dendronhq/engine-server";
import _ from "lodash";
import { Position, Selection, Uri } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
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

export const findHeaderPos = (opts: { anchor: string; text: string }) => {
  const { anchor, text } = opts;
  const anchorSlug = getSlugger().slug(anchor);
  // TODO: optimize by doing this on startup
  const headers = ParserUtilsV2.findHeaders(text);
  const headerMatch: Heading | undefined = _.find(headers, (h) => {
    return getSlugger().slug(h.children[0].value as string) === anchorSlug;
  });
  if (headerMatch) {
    const line = (headerMatch.position?.start.line as number) - 1;
    const pos = new Position(line, 0);
    return pos;
  }
  return new Position(0, 0);
};

export class GotoNoteCommand extends BasicCommand<CommandOpts, CommandOutput> {
  static key = DENDRON_COMMANDS.GOTO_NOTE.key;

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const ctx = "GotoNoteCommand";
    this.L.info({ ctx, opts, msg: "enter" });
    const { qs, vault } = opts;
    let pos: undefined | Position;
    if (opts.mode === "note") {
      const client = DendronWorkspace.instance().getEngine();
      return DendronWorkspace.instance().pauseWatchers<CommandOutput>(
        async () => {
          const { data } = await client.getNoteByPath({
            npath: qs,
            createIfNew: true,
            vault,
          });
          const note = data?.note as NotePropsV2;
          const npath = NoteUtilsV2.getPathV4({
            note,
            wsRoot: DendronWorkspace.wsRoot(),
          });
          const uri = Uri.file(npath);
          const editor = await VSCodeUtils.openFileInEditor(uri);
          this.L.info({ ctx, opts, msg: "exit" });
          if (opts.anchor && editor) {
            const text = editor.document.getText();
            const pos = findHeaderPos({ anchor: opts.anchor.value, text });
            editor.selection = new Selection(pos, pos);
            editor.revealRange(editor.selection);
          }
          return { note, pos };
        }
      );
    } else {
      throw new DendronError({ msg: "goto schema not implemented" });
    }
  }
}
