import { LookupControllerV2 } from "../components/lookup/LookupControllerV2";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { Logger } from "../logger";
import { VSCodeUtils } from "../utils";
import { BasicCommand } from "./base";

export type LookupEffectType = "copyNoteLink" | "copyNoteRef";
export type LookupFilterType = "directChildOnly";
export type LookupSelectionType = "selection2link" | "selectionExtract";
export type LookupNoteType = "journal" | "scratch";
export type LookupSplitType = "horizontal";
export type LookupNoteExistBehavior = "open" | "overwrite";

type CommandOpts = {
  /**
   * When creating new note, controls
   * behavior of selected text
   */
  selectionType?: LookupSelectionType;
  filterType?: LookupFilterType;
  /**
   * If set, controls path of note
   */
  noteType?: LookupNoteType;
  /**
   * If set, open note in a new split
   */
  splitType?: LookupSplitType;
  flavor: any;
  noConfirm?: boolean;
  value?: string;
  noteExistBehavior?: LookupNoteExistBehavior;
  effectType?: LookupEffectType;
};

type CommandOutput = DendronQuickPickerV2;

export { CommandOpts as LookupCommandOpts };

export class LookupCommand extends BasicCommand<CommandOpts, CommandOutput> {
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute(opts: CommandOpts) {
    const ctx = "LookupCommand:execute";
    Logger.info({ ctx, opts, msg: "enter" });
    const controller = new LookupControllerV2({ flavor: opts.flavor }, opts);
    const resp = await VSCodeUtils.extractRangeFromActiveEditor();
    return controller.show({
      ...resp,
      noConfirm: opts.noConfirm,
      value: opts.value,
    });
  }
}
