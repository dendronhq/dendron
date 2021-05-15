import {
  DendronError,
  ERROR_STATUS,
  NoteProps,
  NoteQuickInput,
  NoteUtils,
} from "@dendronhq/common-all";
import { HistoryService } from "@dendronhq/engine-server";
import _ from "lodash";
import { Uri, window } from "vscode";
import {
  DirectChildFilterBtn,
  MultiSelectBtn,
} from "../components/lookup/buttons";
import { LookupControllerV3 } from "../components/lookup/LookupControllerV3";
import {
  ILookupProviderV3,
  NoteLookupProvider,
  NoteLookupProviderSuccessResp,
} from "../components/lookup/LookupProviderV3";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import {
  node2Uri,
  NotePickerUtils,
  OldNewLocation,
  PickerUtilsV2,
} from "../components/lookup/utils";
import { Logger } from "../logger";
import { DendronWorkspace, getEngine } from "../workspace";
import { BaseCommand } from "./base";
import { LookupFilterType } from "./LookupCommand";

type CommandRunOpts = {
  initialValue?: string;
  noConfirm?: boolean;
  fuzzThreshold?: number;
  multiSelect?: boolean;
  /**
   * NOTE: currently, only one filter is supported
   */
  filterMiddleware?: LookupFilterType[];
};

/**
 * Everything that's necessary to initialize the quickpick
 */
type CommandGatherOutput = {
  quickpick: DendronQuickPickerV2;
  controller: LookupControllerV3;
  provider: ILookupProviderV3;
  noConfirm?: boolean;
  fuzzThreshold?: number;
};

/**
 * Passed into execute command
 */
type CommandOpts = {
  selectedItems: readonly NoteQuickInput[];
} & CommandGatherOutput;

type CommandOutput = {
  quickpick: DendronQuickPickerV2;
  controller: LookupControllerV3;
  provider: ILookupProviderV3;
};

type OnDidAcceptReturn = {
  uri: Uri;
  node: NoteProps;
  resp?: any;
};

export { CommandOpts as LookupCommandOptsV3 };

export class NoteLookupCommand extends BaseCommand<
  CommandOpts,
  CommandOutput,
  CommandGatherOutput,
  CommandRunOpts
> {
  protected _controller: LookupControllerV3 | undefined;
  protected _provider: ILookupProviderV3 | undefined;

  constructor() {
    super("LookupCommandV3");
  }

  protected get controller(): LookupControllerV3 {
    if (_.isUndefined(this._controller)) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: "controller not set",
      });
    }
    return this._controller;
  }

  protected get provider(): ILookupProviderV3 {
    if (_.isUndefined(this._provider)) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: "provider not set",
      });
    }
    return this._provider;
  }

  async gatherInputs(opts: CommandRunOpts): Promise<CommandGatherOutput> {
    const ctx = "LookupCommand:execute";
    Logger.info({ ctx, opts, msg: "enter" });
    // initialize controller and provider
    this._controller = LookupControllerV3.create({
      extraButtons: [
        MultiSelectBtn.create(opts.multiSelect),
        DirectChildFilterBtn.create(
          opts.filterMiddleware?.includes("directChildOnly")
        ),
      ],
    });
    this._provider = new NoteLookupProvider("lookup", {
      allowNewNote: true,
      noHidePickerOnAccept: true,
    });
    const lc = this.controller;
    if (opts.fuzzThreshold) {
      lc.fuzzThreshold = opts.fuzzThreshold;
    }
    const { quickpick } = await lc.prepareQuickPick({
      title: "Lookup",
      placeholder: "a seed",
      provider: this.provider,
      initialValue:
        opts.initialValue || NotePickerUtils.getInitialValueFromOpenEditor(),
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

  async enrichInputs(
    opts: CommandGatherOutput
  ): Promise<CommandOpts | undefined> {
    return new Promise((resolve) => {
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
          } else if (event.action === "error") {
            const error = event.data.error as DendronError;
            window.showErrorMessage(error.message);
            resolve(undefined);
          } else {
            throw new DendronError({ message: `unexpected event: ${event}` });
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

  async execute(opts: CommandOpts) {
    const { quickpick } = opts;
    const selected = quickpick.canSelectMany
      ? quickpick.selectedItems
      : quickpick.selectedItems.slice(0, 1);
    // if not selecting many, we want to check for a perfect match
    const out = await Promise.all(
      selected.map((item) => {
        return this.acceptItem(item);
      })
    );
    const outClean = out.filter(
      (ent) => !_.isUndefined(ent)
    ) as OnDidAcceptReturn[];
    await _.reduce(
      outClean,
      async (acc, item) => {
        await acc;
        return quickpick.showNote!(item.uri);
      },
      Promise.resolve({})
    );
    return opts;
  }

  async acceptItem(
    item: NoteQuickInput
  ): Promise<OnDidAcceptReturn | undefined> {
    if (PickerUtilsV2.isCreateNewNotePick(item)) {
      return this.acceptNewItem(item);
    } else {
      return this.acceptExistingItem(item);
    }
  }
  async acceptExistingItem(
    item: NoteQuickInput
  ): Promise<OnDidAcceptReturn | undefined> {
    const uri = node2Uri(item);
    return { uri, node: item };
  }

  async acceptNewItem(
    item: NoteQuickInput
  ): Promise<OnDidAcceptReturn | undefined> {
    const ctx = "acceptNewItem";
    const picker = this.controller.quickpick;
    const fname = PickerUtilsV2.getValue(picker);
    const engine = getEngine();
    let nodeNew: NoteProps;
    if (item.stub) {
      Logger.info({ ctx, msg: "create stub" });
      nodeNew = engine.notes[item.id];
    } else {
      let vault = picker.vault
        ? picker.vault
        : PickerUtilsV2.getOrPromptVaultForOpenEditor();
      nodeNew = NoteUtils.create({ fname, vault });
    }
    const resp = await engine.writeNote(nodeNew, {
      newNode: true,
    });
    if (resp.error) {
      Logger.error({ ctx, error: resp.error });
      return;
    }
    let uri = NoteUtils.getURI({
      note: nodeNew,
      wsRoot: DendronWorkspace.wsRoot(),
    });
    return { uri, node: nodeNew, resp };
  }

  async acceptItem(
    item: NoteQuickInput
  ): Promise<OnDidAcceptReturn | undefined> {
    if (PickerUtilsV2.isCreateNewNotePick(item)) {
      return this.acceptNewItem(item);
    } else {
      throw "not implemented";
    }
  }
  async acceptNewItem(
    item: NoteQuickInput
  ): Promise<OnDidAcceptReturn | undefined> {
    const ctx = "acceptNewItem";
    const picker = this.controller.quickpick;
    const fname = PickerUtilsV2.getValue(picker);
    const engine = getEngine();
    let nodeNew: NoteProps;
    if (item.stub) {
      Logger.info({ ctx, msg: "create stub" });
      nodeNew = engine.notes[item.id];
    } else {
      let vault = picker.vault
        ? picker.vault
        : PickerUtilsV2.getOrPromptVaultForOpenEditor();
      nodeNew = NoteUtils.create({ fname, vault });
    }
    const resp = await engine.writeNote(nodeNew, {
      newNode: true,
    });
    if (resp.error) {
      Logger.error({ ctx, error: resp.error });
      return;
    }
    let uri = NoteUtils.getURI({
      note: nodeNew,
      wsRoot: DendronWorkspace.wsRoot(),
    });
    return { uri, node: nodeNew, resp };
  }
}
