import {
  DendronError,
  DVault,
  ERROR_STATUS,
  ErrorFactory,
  SchemaModuleProps,
  SchemaQuickInput,
  SchemaUtils,
  VSCodeEvents,
} from "@dendronhq/common-all";
import { getDurationMilliseconds, vault2Path } from "@dendronhq/common-server";
import { HistoryService } from "@dendronhq/engine-server";
import _ from "lodash";
import { Uri } from "vscode";
import { LookupControllerV3 } from "../components/lookup/LookupControllerV3";
import {
  ILookupProviderV3,
  SchemaLookupProvider,
  SchemaLookupProviderSuccessResp,
} from "../components/lookup/LookupProviderV3";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { OldNewLocation, PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { AnalyticsUtils } from "../utils/analytics";
import { getDWorkspace } from "../workspace";
import { BaseCommand } from "./base";

type CommandRunOpts = {
  initialValue?: string;
  noConfirm?: boolean;
};

type CommandGatherOutput = {
  quickpick: DendronQuickPickerV2;
  controller: LookupControllerV3;
  provider: ILookupProviderV3;
  noConfirm?: boolean;
  fuzzThreshold?: number;
};

type CommandOpts = {
  selectedItems: readonly SchemaQuickInput[];
} & CommandGatherOutput;

export type CommandOutput = {
  quickpick: DendronQuickPickerV2;
  controller: LookupControllerV3;
  provider: ILookupProviderV3;
};

type OnDidAcceptReturn = {
  uri: Uri;
  node: SchemaModuleProps;
  resp?: any;
};

export class SchemaLookupCommand extends BaseCommand<
  CommandOpts,
  CommandOutput,
  CommandGatherOutput,
  CommandRunOpts
> {
  key = DENDRON_COMMANDS.LOOKUP_SCHEMA.key;
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
    const start = process.hrtime();
    const ctx = "SchemaLookupCommand:gatherInput";
    Logger.info({ ctx, opts, msg: "enter" });
    const copts: CommandRunOpts = opts || {};
    this._controller = LookupControllerV3.create({
      nodeType: "schema",
    });
    this._provider = new SchemaLookupProvider("schemaLookup", {
      allowNewNote: true,
      noHidePickerOnAccept: false,
    });
    const lc = this.controller;

    const { quickpick } = await lc.prepareQuickPick({
      title: "Lookup Schema",
      placeholder: "schema",
      provider: this.provider,
      initialValue: copts.initialValue,
      nonInteractive: copts.noConfirm,
      alwaysShow: true,
    });

    const profile = getDurationMilliseconds(start);
    AnalyticsUtils.track(VSCodeEvents.SchemaLookup_Gather, {
      duration: profile,
    });

    return {
      controller: this.controller,
      provider: this.provider,
      quickpick,
      noConfirm: copts.noConfirm,
    };
  }

  async enrichInputs(
    opts: CommandGatherOutput
  ): Promise<CommandOpts | undefined> {
    return new Promise((resolve) => {
      const start = process.hrtime();
      HistoryService.instance().subscribev2("lookupProvider", {
        id: "schemaLookup",
        listener: async (event) => {
          if (event.action === "done") {
            const data =
              event.data as SchemaLookupProviderSuccessResp<OldNewLocation>;
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
            this.L.error({ error });
            resolve(undefined);
          } else if (
            event.data &&
            event.action === "changeState" &&
            event.data.action === "hide"
          ) {
            // changeState/hide is triggered when user cancels schema lookup
            this.L.info({
              ctx: `SchemaLookupCommand`,
              msg: `changeState.hide event received.`,
            });
            resolve(undefined);
          } else {
            const error = ErrorFactory.createUnexpectedEventError({ event });
            this.L.error({ error });
          }
          HistoryService.instance().remove("schemaLookup", "lookupProvider");
        },
      });

      opts.controller.showQuickPick({
        provider: opts.provider,
        quickpick: opts.quickpick,
        nonInteractive: opts.noConfirm,
      });
      const profile = getDurationMilliseconds(start);
      AnalyticsUtils.track(VSCodeEvents.SchemaLookup_Show, {
        duration: profile,
      });
    });
  }

  async acceptItem(
    item: SchemaQuickInput
  ): Promise<OnDidAcceptReturn | undefined> {
    let result: Promise<OnDidAcceptReturn | undefined>;
    const start = process.hrtime();
    const isNew = PickerUtilsV2.isCreateNewNotePick(item);
    if (isNew) {
      result = this.acceptNewSchemaItem();
    } else {
      result = this.acceptExistingSchemaItem(item);
    }
    const profile = getDurationMilliseconds(start);
    AnalyticsUtils.track(VSCodeEvents.SchemaLookup_Accept, {
      duration: profile,
      isNew,
    });
    return result;
  }

  async acceptExistingSchemaItem(
    item: SchemaQuickInput
  ): Promise<OnDidAcceptReturn | undefined> {
    const { wsRoot, engine } = getDWorkspace();
    const schemas = engine.schemas;
    const vpath = vault2Path({
      vault: item.vault,
      wsRoot,
    });
    const schemaModule = schemas[item.id];
    const uri = Uri.file(
      SchemaUtils.getPath({
        root: vpath,
        fname: schemaModule.fname,
      })
    );
    return { uri, node: schemaModule };
  }

  async acceptNewSchemaItem(): Promise<OnDidAcceptReturn | undefined> {
    const picker = this.controller.quickpick;
    const fname = picker.value;
    const { engine } = getDWorkspace();
    const vault: DVault = picker.vault
      ? picker.vault
      : PickerUtilsV2.getVaultForOpenEditor();
    const nodeSchemaModuleNew: SchemaModuleProps =
      SchemaUtils.createModuleProps({
        fname,
        vault,
      });
    const vpath = vault2Path({ vault, wsRoot: getDWorkspace().wsRoot });
    const uri = Uri.file(SchemaUtils.getPath({ root: vpath, fname }));
    const resp = await engine.writeSchema(nodeSchemaModuleNew);

    return { uri, node: nodeSchemaModuleNew, resp };
  }

  async execute(opts: CommandOpts) {
    try {
      const { quickpick } = opts;
      const selected = quickpick.selectedItems.slice(
        0,
        1
      ) as SchemaQuickInput[];
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
    } finally {
      opts.controller.onHide();
    }
    return opts;
  }
}
