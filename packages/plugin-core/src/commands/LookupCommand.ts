import { LookupController } from "../components/lookup/LookupController";
import { LookupControllerV2 } from "../components/lookup/LookupControllerV2";
import {
  DendronQuickPicker,
  DendronQuickPickerV2,
  EngineFlavor,
} from "../components/lookup/LookupProvider";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

export type LookupSelectionType = "selection2link" | "selectionExtract";
export type LookupNoteType = "journal" | "scratch";
export type LookupSplitType = "horizontal" | "vertical";

type CommandOpts = {
  selectionType?: LookupSelectionType;
  noteType?: LookupNoteType;
  splitType?: LookupSplitType;
  flavor: EngineFlavor;
};

type CommandOutput = DendronQuickPicker | DendronQuickPickerV2;

export { CommandOpts as LookupCommandOpts };

export class LookupCommand extends BasicCommand<CommandOpts, CommandOutput> {
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute(opts: CommandOpts) {
    if (DendronWorkspace.lsp()) {
      const controller = new LookupControllerV2({ flavor: opts.flavor }, opts);
      const resp = await VSCodeUtils.extractRangeFromActiveEditor();
      return controller.show({ ...resp });
    } else {
      const controller = new LookupController(
        DendronWorkspace.instance(),
        { flavor: "note" },
        opts
      );
      const resp = await VSCodeUtils.extractRangeFromActiveEditor();
      return controller.show({ ...resp });
    }
  }
}
