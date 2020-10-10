import {
  DendronError,
  DNode,
  IDNodeType,
  NotePropsV2,
  NoteUtilsV2,
} from "@dendronhq/common-all";
import path from "path";
import { Uri } from "vscode";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = { qs: string; mode: IDNodeType };
export { CommandOpts as GotoNoteCommandOpts };

type CommandOutput = DNode | NotePropsV2;

export class GotoNoteCommand extends BasicCommand<CommandOpts, CommandOutput> {
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute(opts: CommandOpts) {
    const ctx = "GotoNoteCommand";
    this.L.info({ ctx, opts, msg: "enter" });
    const { qs, mode } = opts;
    if (DendronWorkspace.lsp()) {
      if (opts.mode === "note") {
        const client = DendronWorkspace.instance().getEngine();
        const { data } = await client.getNoteByPath({
          npath: qs,
          createIfNew: true,
        });
        const note = data?.note as NotePropsV2;
        const npath = NoteUtilsV2.getPath({ note, client });
        const uri = Uri.file(npath);
        await VSCodeUtils.openFileInEditor(uri);
        this.L.info({ ctx, opts, msg: "exit" });
        return note;
      } else {
        throw new DendronError({ msg: "goto schema not implemented" });
      }
    }
    const engine = DendronWorkspace.instance().engine;
    const resp = engine.queryOne(qs, mode, { createIfNew: true });
    const node = (await resp).data;
    const uri = Uri.file(path.join(engine.props.root, node.fname + ".md"));
    await VSCodeUtils.openFileInEditor(uri);
    return node;
  }
}
