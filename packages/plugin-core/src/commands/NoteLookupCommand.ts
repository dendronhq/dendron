import { DendronError, NoteQuickInput } from "@dendronhq/common-all";
import { HistoryService } from "@dendronhq/engine-server";
import { window } from "vscode";
import { MultiSelectBtn } from "../components/lookup/buttons";
import { LookupControllerV3 } from "../components/lookup/LookupControllerV3";
import {
  ILookupProviderV3,
  NoteLookupProvider,
  NoteLookupProviderSuccessResp,
} from "../components/lookup/LookupProviderV3";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { OldNewLocation } from "../components/lookup/utils";
import { Logger } from "../logger";
import { BaseCommand } from "./base";
import {
  LookupEffectType,
  LookupFilterType,
  LookupNoteExistBehavior,
  LookupNoteType,
  LookupSelectionType,
  LookupSplitType,
} from "./LookupCommand";

type CommandRunOpts = {
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
  initialValue?: string;
  noteExistBehavior?: LookupNoteExistBehavior;
  effectType?: LookupEffectType;
  noConfirm?: boolean;
  fuzzThreshold?: number;
};

type CommandGatherOutput = {
  quickpick: DendronQuickPickerV2;
  controller: LookupControllerV3;
  provider: ILookupProviderV3;
  noConfirm?: boolean;
  fuzzThreshold?: number;
};

type CommandOpts = {
  selectedItems: NoteQuickInput[];
} & CommandGatherOutput;

type CommandOutput = {
  quickpick: DendronQuickPickerV2;
  controller: LookupControllerV3;
  provider: ILookupProviderV3;
};

export { CommandOpts as LookupCommandOptsV3 };

export class NoteLookupCommand extends BaseCommand<
  CommandOpts,
  CommandOutput,
  CommandGatherOutput,
  CommandRunOpts
> {
  protected controller: LookupControllerV3;
  protected provider: ILookupProviderV3;

  constructor() {
    super("LookupCommandV3");
    this.controller = LookupControllerV3.create({
      extraButtons: [MultiSelectBtn.create()],
    });
    this.provider = new NoteLookupProvider("lookup", { allowNewNote: true });
  }

  async enrichInputs(
    opts: CommandGatherOutput
  ): Promise<CommandOpts | undefined> {
    return new Promise((resolve) => {
      const lc = opts.controller;
      HistoryService.instance().subscribev2("lookupProvider", {
        id: "lookup",
        listener: async (event) => {
          if (event.action === "done") {
            HistoryService.instance().remove(
              this.provider.id,
              "lookupProvider"
            );
            const data = event.data as NoteLookupProviderSuccessResp<
              OldNewLocation
            >;
            if (data.cancel) {
              resolve(undefined);
            }
            const _opts: CommandOpts = {
              selectedItems: data.selectedItems,
              ...opts,
            };
            resolve(_opts);
            lc.onHide();
          } else if (event.action === "error") {
            const error = event.data.error as DendronError;
            lc.onHide();
            window.showErrorMessage(error.msg);
            resolve(undefined);
          } else {
            throw new DendronError({ msg: `unexpected event: ${event}` });
          }
        },
      });

      // show quickpick (maybe)
      opts.controller.showQuickPick({
        provider: opts.provider,
        quickpick: opts.quickpick,
        nonInteractive: opts.noConfirm,
        fuzzThreshold: opts.fuzzThreshold,
      });
    });
  }

  async gatherInputs(opts: CommandRunOpts): Promise<CommandGatherOutput> {
    const ctx = "LookupCommand:execute";
    Logger.info({ ctx, opts, msg: "enter" });
    const lc = this.controller;
    if (opts.fuzzThreshold) {
      lc.fuzzThreshold = opts.fuzzThreshold;
    }
    const { quickpick } = await lc.prepareQuickPick({
      title: "Lookup",
      placeholder: "a seed",
      provider: this.provider,
      initialValue: opts.initialValue,
      nonInteractive: opts.noConfirm,
    });
    return {
      controller: this.controller,
      provider: this.provider,
      quickpick,
      noConfirm: opts.noConfirm,
      fuzzThreshold: opts.fuzzThreshold,
    };
  }

  async execute(opts: CommandOpts) {
    return opts;
  }
}
