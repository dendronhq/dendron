import { 
  NoteUtils,
  DNodeUtils,
  NoteQuickInput,
  RespV2,
  NoteProps,
  SchemaModuleProps, 
  SchemaQuickInput, 
  SchemaUtils 
} from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import { HistoryService } from "@dendronhq/engine-server";
import _ from "lodash";
import { CancellationToken, window } from "vscode";
import { Logger } from "../../logger";
import { DendronWorkspace } from "../../workspace";
import { LookupControllerV3 } from "./LookupControllerV3";
import { DendronQuickPickerV2 } from "./types";
import { NotePickerUtils, OldNewLocation, PickerUtilsV2, SchemaPickerUtils } from "./utils";

export type OnUpdatePickerItemsOpts = {
  picker: DendronQuickPickerV2;
  token: CancellationToken;
  fuzzThreshold?: number;
};

export type OnAcceptHook = (opts: {
  quickpick: DendronQuickPickerV2;
  selectedItems: NoteQuickInput[];
}) => Promise<RespV2<any>>;

export type ILookupProviderV3 = {
  id: string;
  provide: (lc: LookupControllerV3) => Promise<void>;
  onUpdatePickerItems: (opts: OnUpdatePickerItemsOpts) => Promise<void>;
  registerOnAcceptHook: (hook: OnAcceptHook) => void;
  onDidAccept(opts: {
    quickpick: DendronQuickPickerV2;
    lc: LookupControllerV3;
  }): any;
};

export type ILookupProviderOptsV3 = {
  allowNewNote: boolean;
  noHidePickerOnAccept?: boolean;
};

export type NoteLookupProviderSuccessResp<T = never> = {
  selectedItems: readonly NoteQuickInput[];
  onAcceptHookResp: T[];
  cancel?: boolean;
};

export type SchemaLookupProviderSuccessResp<T = never> = {
  selectedItems: readonly SchemaQuickInput[];
  onAcceptHookResp: T[];
  cancel?: boolean;
}

export class NoteLookupProvider implements ILookupProviderV3 {
  private _onAcceptHooks: OnAcceptHook[];
  public opts: ILookupProviderOptsV3;

  constructor(public id: string, opts: ILookupProviderOptsV3) {
    this._onAcceptHooks = [];
    this.opts = opts;
  }

  async provide(lc: LookupControllerV3) {
    const quickpick = lc.quickpick;
    const onUpdatePickerItems = _.bind(this.onUpdatePickerItems, this);
    const onUpdateDebounced = _.debounce(
      () => {
        onUpdatePickerItems({
          picker: quickpick,
          token: lc.createCancelSource().token,
          fuzzThreshold: lc.fuzzThreshold,
        } as OnUpdatePickerItemsOpts);
      },
      100,
      {
        leading: true,
      }
    );
    quickpick.onDidChangeValue(onUpdateDebounced);
    quickpick.onDidAccept(() => {
      Logger.info({
        ctx: "NoteLookupProvider:onDidAccept",
        quickpick: quickpick.value,
      });
      onUpdateDebounced.cancel();
      this.onDidAccept({ quickpick, lc })();
    });
    return;
  }

  /**
   * Takes selection and runs accept, followed by hooks.
   * @param opts
   * @returns
   */
  onDidAccept(opts: {
    quickpick: DendronQuickPickerV2;
    lc: LookupControllerV3;
  }) {
    return async () => {
      const ctx = "LookupProvider:onDidAccept"
      const { quickpick: picker, lc } = opts;
      const nextPicker = picker.nextPicker;
      if (nextPicker) {
        picker.vault = await nextPicker();
        // check if we exited from selecting a vault
        if (_.isUndefined(picker.vault)) {
          HistoryService.instance().add({
            source: "lookupProvider",
            action: "done",
            id: this.id,
            data: { cancel: true },
          });
          return;
        }
      }
      const selectedItems = NotePickerUtils.getSelection(picker);
      Logger.debug({ctx, selectedItems: selectedItems.map(item => NoteUtils.toLogObj(item))});
      // last chance to cancel
      lc.cancelToken.cancel();
      if (!this.opts.noHidePickerOnAccept) {
        picker.hide();
      }
      const onAcceptHookResp = await Promise.all(
        await this._onAcceptHooks.map((hook) =>
          hook({ quickpick: picker, selectedItems })
        )
      );
      const errors = _.filter(onAcceptHookResp, (ent) => ent.error);
      if (!_.isEmpty(errors)) {
        HistoryService.instance().add({
          source: "lookupProvider",
          action: "error",
          id: this.id,
          data: { error: errors[0] },
        });
      } else {
        HistoryService.instance().add({
          source: "lookupProvider",
          action: "done",
          id: this.id,
          data: {
            selectedItems,
            onAcceptHookResp: _.map(onAcceptHookResp, (ent) => ent.data!),
          } as NoteLookupProviderSuccessResp<OldNewLocation>,
        });
      }
    };
  }

  async onUpdatePickerItems(opts: OnUpdatePickerItemsOpts) {
    const { picker, token } = opts;
    const ctx = "updatePickerItems";
    picker.busy = true;
    let pickerValue = picker.value;
    const start = process.hrtime();

    // just activated picker's have special behavior
    if (picker._justActivated && !picker.nonInteractive) {
      const lastDotIndex = pickerValue.lastIndexOf(".");
      if (lastDotIndex < 0) {
        pickerValue = "";
      } else {
        // assume query from last dot
        pickerValue = pickerValue.slice(0, lastDotIndex + 1);
      }
    }

    // get prior
    const querystring = PickerUtilsV2.slashToDot(pickerValue);
    const queryOrig = PickerUtilsV2.slashToDot(picker.value);
    const ws = DendronWorkspace.instance();
    let profile: number;
    const queryEndsWithDot = queryOrig.endsWith(".");
    const queryUpToLastDot =
      queryOrig.lastIndexOf(".") >= 0
      ? queryOrig.slice(0, queryOrig.lastIndexOf("."))
      : undefined;

    const engine = ws.getEngine();
    Logger.info({ ctx, msg: "enter", queryOrig });
    try {
      // if empty string, show all 1st level results
      if (querystring === "") {
        Logger.debug({ ctx, msg: "empty qs" });
        picker.items = NotePickerUtils.fetchRootResults({ engine });
        return;
      }

      // initialize with current picker items without default items present
      const items: NoteQuickInput[] = [...picker.items];
      let updatedItems = PickerUtilsV2.filterDefaultItems(items);
      if (token.isCancellationRequested) {
        return;
      }

      updatedItems = await NotePickerUtils.fetchPickerResults({
        picker,
        qs: querystring,
      });
      if (token.isCancellationRequested) {
        return;
      }

      // check if we have an exact match in the results and keep track for later
      const perfectMatch: boolean = !_.isUndefined(_.find(updatedItems, { fname: queryOrig }));

      // check if single item query, vscode doesn't surface single letter queries
      // we need this so that suggestions will show up
      // TODO: this might be buggy since we don't apply filter middleware
      if (picker.activeItems.length === 0 && querystring.length === 1) {
        picker.items = updatedItems;
        picker.activeItems = picker.items;
        return;
      }

      // add schema completions
      if (!_.isUndefined(queryUpToLastDot)) {
        const results = SchemaUtils.matchPath({
          notePath: queryUpToLastDot,
          schemaModDict: engine.schemas,
        });
        // since namespace matches everything, we don't do queries on that
        if (results && !results.namespace) {
          const { schema, schemaModule } = results;
          const dirName = queryUpToLastDot;
          const candidates = schema.children
            .map((ent) => {
              const mschema = schemaModule.schemas[ent];
              if (
                SchemaUtils.hasSimplePattern(mschema, {
                  isNotNamespace: true,
                })
              ) {
                const pattern = SchemaUtils.getPattern(mschema, {
                  isNotNamespace: true,
                });
                const fname = [dirName, pattern].join(".");
                return NoteUtils.fromSchema({
                  schemaModule,
                  schemaId: ent,
                  fname,
                  vault: PickerUtilsV2.getVaultForOpenEditor(),
                });
              }
              return;
            })
            .filter(Boolean) as NoteProps[];
          const candidatesToAdd = _.differenceBy(
            candidates,
            updatedItems,
            (ent) => ent.fname
          );
          updatedItems = updatedItems.concat(
            candidatesToAdd.map((ent) => {
              return DNodeUtils.enhancePropForQuickInputV3({
                wsRoot: DendronWorkspace.wsRoot(),
                props: ent,
                schemas: engine.schemas,
                vaults: DendronWorkspace.instance().vaultsv4,
              });
            })
          );
        }
      }

      // filter the results through optional middleware
      if (picker.filterMiddleware) {
        updatedItems = picker.filterMiddleware(updatedItems);
      }

      // if new notes are allowed and we didn't get a perfect match, append `Create New` option
      // to picker results
      // NOTE: order matters. we always pick the first item in single select mode
      Logger.debug({ ctx, msg: "active != qs" });
      updatedItems =
        this.opts.allowNewNote &&
        !queryEndsWithDot &&
        !picker.canSelectMany &&
        !perfectMatch
          ? updatedItems.concat([NotePickerUtils.createNoActiveItem({} as any)])
          : updatedItems;

      // check fuzz threshold. tune fuzzyness. currently hardcoded
      // TODO: in the future this should be done in the engine
      if (opts.fuzzThreshold === 1) {
        updatedItems = updatedItems.filter((ent) => ent.fname === picker.value);
      }
      picker.items = updatedItems;
    } catch (err) {
      window.showErrorMessage(err);
      throw Error(err);
    } finally {
      profile = getDurationMilliseconds(start);
      picker.busy = false;
      picker._justActivated = false;
      picker.prevValue = picker.value;
      Logger.info({
        ctx,
        msg: "exit",
        queryOrig,
        profile,
        cancelled: token.isCancellationRequested,
      });
      return; // eslint-disable-line no-unsafe-finally -- probably can be just removed
    }
  }

  registerOnAcceptHook(hook: OnAcceptHook) {
    this._onAcceptHooks.push(hook);
  }
}

export class SchemaLookupProvider implements ILookupProviderV3 {
  private _onAcceptHooks: OnAcceptHook[];
  public opts: ILookupProviderOptsV3;

  constructor(public id: string, opts: ILookupProviderOptsV3) {
    this._onAcceptHooks = [];
    this.opts = opts;
  }

  async provide(lc: LookupControllerV3) {
    const quickpick = lc.quickpick;
    const onUpdatePickerItems = _.bind(this.onUpdatePickerItems, this);
    const onUpdateDebounced = _.debounce(
      () => {
        onUpdatePickerItems({
          picker: quickpick,
          token: lc.createCancelSource().token,
          fuzzThreshold: lc.fuzzThreshold,
        } as OnUpdatePickerItemsOpts);
      },
      100,
      {
        leading: true,
        maxWait: 200,
      }
    );
    quickpick.onDidChangeValue(onUpdateDebounced);
    quickpick.onDidAccept(() => {
      Logger.info({
        ctx: "SchemaLookupProvider:onDidAccept",
        quickpick: quickpick.value,
      });
      onUpdateDebounced.cancel();
      this.onDidAccept({ quickpick, lc })();
    });
    return;
  }

  /**
   * Takes selection and runs accept, followed by hooks.
   * @param opts
   * @returns
   */
  onDidAccept(opts: {
    quickpick: DendronQuickPickerV2;
    lc: LookupControllerV3;
  }) {
    return async () => {
      const { quickpick: picker, lc } = opts;
      const nextPicker = picker.nextPicker;
      if (nextPicker) {
        picker.vault = await nextPicker();
        // check if we exited from selecting a vault
        if (_.isUndefined(picker.vault)) {
          HistoryService.instance().add({
            source: "lookupProvider",
            action: "done",
            id: this.id,
            data: { cancel: true },
          });
          return;
        }
      }
      const selectedItems = NotePickerUtils.getSelection(picker);
      const isMultiLevel = picker.value.split(".").length > 1;
      if (isMultiLevel) {
        window.showErrorMessage("schemas can only be one level deep");
        return;
      }
      // last chance to cancel
      lc.cancelToken.cancel();
      if (!this.opts.noHidePickerOnAccept) {
        picker.hide();
      }
      const onAcceptHookResp = await Promise.all(
        await this._onAcceptHooks.map((hook) =>
          hook({ quickpick: picker, selectedItems })
        )
      );
      const errors = _.filter(onAcceptHookResp, (ent) => ent.error);
      if (!_.isEmpty(errors)) {
        HistoryService.instance().add({
          source: "lookupProvider",
          action: "error",
          id: this.id,
          data: { error: errors[0] },
        });
      } else {
        HistoryService.instance().add({
          source: "lookupProvider",
          action: "done",
          id: this.id,
          data: {
            selectedItems,
            onAcceptHookResp: _.map(onAcceptHookResp, (ent) => ent.data!),
          } as SchemaLookupProviderSuccessResp<OldNewLocation>,
        });
      }
    };
  }

  async onUpdatePickerItems(opts: OnUpdatePickerItemsOpts) {
    const { picker, token } = opts;
    const ctx = "updatePickerItems";
    picker.busy = true;
    const pickerValue = picker.value;
    const start = process.hrtime();

    // get prior
    const querystring = PickerUtilsV2.slashToDot(pickerValue);
    const queryOrig = PickerUtilsV2.slashToDot(picker.value);
    const ws = DendronWorkspace.instance();
    let profile: number;

    const engine = ws.getEngine();
    Logger.info({ ctx, msg: "enter", queryOrig });
    try {
      // if empty string, show all 1st level results
      if (querystring === "") {
        Logger.debug({ ctx, msg: "empty qs" });
        const nodes = _.map(_.values(engine.schemas), (ent: SchemaModuleProps) => {
          return SchemaUtils.getModuleRoot(ent);
        });
        picker.items = nodes.map((ent) => {
          return DNodeUtils.enhancePropForQuickInputV3({
            wsRoot: DendronWorkspace.wsRoot(),
            props: ent,
            schemas: engine.schemas,
            vaults: ws.vaultsv4,
          });
        });
        return;
      }

      // initialize with current picker items without default items present
      const items: NoteQuickInput[] = [...picker.items];
      let updatedItems = PickerUtilsV2.filterDefaultItems(items);
      if (token.isCancellationRequested) {
        return;
      }

      // if we entered a different level of hierarchy, re-run search
      updatedItems = await SchemaPickerUtils.fetchPickerResults({
        picker,
        qs: querystring,
      })
      if (token.isCancellationRequested) {
        return;
      }

      // // check if we have an exact match in the results and keep track for later
      const perfectMatch = _.find(updatedItems, { fname: queryOrig });

      // check if single item query, vscode doesn't surface single letter queries
      // we need this so that suggestions will show up
      // TODO: this might be buggy since we don't apply filter middleware
      if (picker.activeItems.length === 0 && querystring.length === 1) {
        picker.items = updatedItems;
        picker.activeItems = picker.items;
        return;
      }

      updatedItems =
        this.opts.allowNewNote &&
        !perfectMatch
          ? updatedItems.concat([NotePickerUtils.createNoActiveItem({} as any)])
          : updatedItems;

      picker.items = updatedItems;
    } catch (err) {
      window.showErrorMessage(err);
      throw Error(err);
    } finally {
      profile = getDurationMilliseconds(start);
      picker.busy = false;
      picker._justActivated = false;
      picker.prevValue = picker.value;
      Logger.info({
        ctx,
        msg: "exit",
        queryOrig,
        profile,
        cancelled: token.isCancellationRequested,
      });
      return; // eslint-disable-line no-unsafe-finally -- probably can be just removed
    }
  }

  registerOnAcceptHook(hook: OnAcceptHook) {
    this._onAcceptHooks.push(hook);
  }
}