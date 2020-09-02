import { DNode, IDNodeType } from "@dendronhq/common-all";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";
import { Uri } from "vscode";
import { VSCodeUtils } from "../utils";
import path from "path";

type CommandOpts = { qs: string; mode: IDNodeType };
export { CommandOpts as GotoNoteCommandOpts };

type CommandOutput = DNode;

export class GotoNoteCommand extends BasicCommand<CommandOpts, CommandOutput> {
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute(opts: CommandOpts) {
    const { qs, mode } = opts;
    const engine = DendronWorkspace.instance().engine;
    const resp = engine.queryOne(qs, mode, { createIfNew: true });
    const node = (await resp).data;
    const uri = Uri.file(path.join(engine.props.root, node.fname + ".md"));
    await VSCodeUtils.openFileInEditor(uri);
    return node;
  }
}
