import _ from "lodash";
import { DendronError, ERROR_STATUS } from "@dendronhq/common-all";
import { BaseCommand } from "./base";
import { LookupControllerV3 } from "../components/lookup/LookupControllerV3";
import { ILookupProviderV3, SchemaLookupProvider } from "../components/lookup/LookupProviderV3";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { DENDRON_COMMANDS } from "../constants";

type CommandRunOpts = {
  initialValue?: string;
  noConfirm?: boolean;
}

type CommandGatherOutput = {
  quickpick: DendronQuickPickerV2;
  controller: LookupControllerV3;
  provider: ILookupProviderV3;
  noConfirm?: boolean;
  fuzzThreshold?: number;
}

type CommandOpts = {} & CommandGatherOutput;

export type CommandOutput = {
  quickpick: DendronQuickPickerV2;
  controller: LookupControllerV3;
  provider: ILookupProviderV3;
};

export class SchemaLookupCommand extends BaseCommand<
  CommandOpts,
  CommandOutput,
  CommandGatherOutput,
  CommandRunOpts
> {
  // temp key for now. change to LOOKUP_SCHEMA after deprecating V2
  key = DENDRON_COMMANDS.LOOKUP_SCHEMA_V3.key;
  protected _controller: LookupControllerV3 | undefined;
  protected _provider: ILookupProviderV3 | undefined;

  constructor() {
    super("SchemaLookupCommand");
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

  async gatherInputs(opts?: CommandRunOpts): Promise<CommandGatherOutput> {
    console.log({ctx: "SchemaLookupCommand:gatherInputs"});
    const copts: CommandRunOpts = _.defaults(opts || {}, {
      //TODO
    } as CommandRunOpts);
    this._controller = LookupControllerV3.create({
      nodeType: "schema",
    });
    this._provider = new SchemaLookupProvider("schemaLookup", {
      allowNewNote: true,
      noHidePickerOnAccept: true,
    });
    const lc = this.controller;

    const { quickpick } = await lc.prepareQuickPick({
      title: "Schema Lookup",
      placeholder: "schema",
      provider: this.provider,
      initialValue: copts.initialValue,
      nonInteractive: copts.noConfirm,
      alwaysShow: true,
    })

    return {
      controller: this.controller,
      provider: this.provider,
      quickpick,
      noConfirm: copts.noConfirm,
    }
  };

  async enrichInputs(opts: CommandGatherOutput): Promise<CommandOpts | undefined> {
    console.log({ctx: "SchemaLookupCommand:enrichInputs"});
    return new Promise((resolve) => {
      resolve(undefined);
      opts.controller.showQuickPick({
        provider: opts.provider,
        quickpick: opts.quickpick,
        nonInteractive: opts.noConfirm,
      });
    });
  }

  async execute(opts: CommandOpts) {
    console.log({ctx: "SchemaLookupCommand:execute"});
    return opts;
  }
}
