import { VSCodeEvents } from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import { LookupControllerV2 } from "../components/lookup/LookupControllerV2";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { Logger } from "../logger";
import { VSCodeUtils } from "../utils";
import { AnalyticsUtils } from "../utils/analytics";
import { BasicCommand } from "./base";

export type LookupEffectType = "copyNoteLink" | "copyNoteRef" | "multiSelect";
export enum LookupEffectTypeEnum {
  "copyNoteLink" = "copyNoteLink",
  "copyNoteRef" = "copyNoteRef",
  "multiSelect" = "multiSelect",
}
export type LookupFilterType = "directChildOnly";
export type LookupSelectionType = "selection2link" | "selectionExtract";
export type LookupNoteType = LookupNoteTypeEnum;
export type LookupSplitType = "horizontal";
export enum LookupSplitTypeEnum {
  "horizontal" = "horizontal",
}
export type LookupNoteExistBehavior = "open" | "overwrite";
export enum LookupNoteTypeEnum {
  "journal" = "journal",
  "scratch" = "scratch",
}
export enum LookupSelectionTypeEnum {
  "selection2link" = "selection2link",
  "selectionExtract" = "selectionExtract",
}

/**
 * Mode for prompting the user on which vault should be used to 
 */
export enum VaultSelectionMode {
  /**
   * Never prompt the user. Useful for testing
   */
  auto,

  /**
   * Tries to determine the vault automatically, but will prompt the user if
   * there is ambiguity
   */
  smart,

  /**
   * Always prompt the user if there is more than one vault
   */
  alwaysPrompt
}

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
  vaultSelectionMode?: VaultSelectionMode;
};

type CommandOutput = DendronQuickPickerV2;

export { CommandOpts as LookupCommandOpts };

export class LookupCommand extends BasicCommand<CommandOpts, CommandOutput> {

  // Placeholder for telemetry purposes. More detailed telemetry exists on the lookup command.
  key = "dendron.Lookup";

  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute(opts: CommandOpts) {
    let profile;
    const start = process.hrtime();
    const ctx = "LookupCommand:execute";
    Logger.info({ ctx, opts, msg: "enter" });
    const controller = new LookupControllerV2({ flavor: opts.flavor }, opts);
    profile = getDurationMilliseconds(start);
    Logger.info({ ctx, profile, msg: "postCreateController" });
    const resp = await VSCodeUtils.extractRangeFromActiveEditor();
    profile = getDurationMilliseconds(start);
    Logger.info({ ctx, profile, msg: "post:extractRange" });
    const out = controller.show({
      ...resp,
      noConfirm: opts.noConfirm,
      value: opts.value,
    });
    profile = getDurationMilliseconds(start);
    AnalyticsUtils.track(VSCodeEvents.Lookup_Show, {
      duration: profile,
      flavor: opts.flavor,
    });
    Logger.info({ ctx, profile, msg: "post:show" });
    return out;
  }
}
