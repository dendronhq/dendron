import { LookupController } from "../components/lookup/LookupController";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

export type LookupSelectionType = "selection2link" | "selectionExtract";
export type LookupNoteType = "journal" | "scratch";

type CommandOpts = {
  selectionType?: LookupSelectionType;
  noteType?: LookupNoteType;
};

type CommandOutput = void;

export { CommandOpts as LookupCommandOpts };

export class LookupCommand extends BasicCommand<CommandOpts, CommandOutput> {
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute(opts: CommandOpts) {
    const controller = new LookupController(
      DendronWorkspace.instance(),
      { flavor: "note" },
      opts
    );
    const resp = await VSCodeUtils.extractRangeFromActiveEditor();
    controller.show({ ...resp });
  }
}
