import { NoteQuickInput, RespV2 } from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import { HistoryService } from "@dendronhq/engine-server";
import _ from "lodash";
import { CancellationToken, window } from "vscode";
import { Logger } from "../../logger";
import { DendronWorkspace } from "../../workspace";
import { LookupControllerV3 } from "./LookupControllerV3";
import { DendronQuickPickerV2 } from "./types";
import { NotePickerUtils, OldNewLocation, PickerUtilsV2 } from "./utils";

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

export type NoteLookupProviderSuccessResp<T> = {
  selectedItems: readonly NoteQuickInput[];
  onAcceptHookResp: T[];
  cancel?: boolean;
};

export class NoteLookupProvider implements ILookupProviderV3 {
  private _onAcceptHooks: OnAcceptHook[];
  public opts: ILookupProviderOptsV3;

  constructor(public id: string, opts: ILookupProviderOptsV3) {
    this._onAcceptHooks = [];
    this.opts = opts;
  }

  async provide(lc: LookupControllerV3) {
    const quickpick = lc.quickpick;
    quickpick.onDidChangeValue(() => {
      _.debounce(_.bind(this.onUpdatePickerItems, this), 60, {
        leading: true,
        maxWait: 120,
      })({
        picker: quickpick,
        token: lc.createCancelSource().token,
        fuzzThreshold: lc.fuzzThreshold,
      } as OnUpdatePickerItemsOpts);
    });
    quickpick.onDidAccept(this.onDidAccept({ quickpick, lc }));
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
    if (picker.justActivated && !picker.nonInteractive) {
      // no hiearchy, query everything
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
    // const depth = queryOrig.split(".").length;
    const ws = DendronWorkspace.instance();
    // const vault = this.getVault();
    let profile: number;
    const queryEndsWithDot = queryOrig.endsWith(".");
    // const queryUpToLastDot =
    //   queryOrig.lastIndexOf(".") >= 0
    //     ? queryOrig.slice(0, queryOrig.lastIndexOf("."))
    //     : undefined;

    const engine = ws.getEngine();
    Logger.info({ ctx, msg: "enter", queryOrig });
    try {
      if (querystring === "") {
        Logger.debug({ ctx, msg: "empty qs" });
        picker.items = NotePickerUtils.fetchRootResults({ engine });
        return;
      }

      // current items without default items present
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
      const perfectMatch = _.find(updatedItems, { fname: queryOrig });

      // check if single item query, vscode doesn't surface single letter queries
      if (picker.activeItems.length === 0 && querystring.length === 1) {
        picker.items = updatedItems;
        picker.activeItems = picker.items;
        return;
      }

      if (picker.filterMiddleware) {
        updatedItems = picker.filterMiddleware(updatedItems);
      }

      // const perfectMatch = _.find(updatedItems, { fname: queryOrig });
      // // NOTE: we modify this later so need to track this here
      // const noUpdatedItems = updatedItems.length === 0;
      // regular result
      Logger.debug({ ctx, msg: "active != qs" });
      // NOTE: order matters. we always pick the first item in single select mode
      updatedItems =
        this.opts.allowNewNote &&
        !queryEndsWithDot &&
        !picker.canSelectMany &&
        !perfectMatch
          ? [NotePickerUtils.createNoActiveItem({} as any)].concat(updatedItems)
          : updatedItems;

      // check fuzz threshold
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
      picker.justActivated = false;
      Logger.info({
        ctx,
        msg: "exit",
        queryOrig,
        profile,
        cancelled: token.isCancellationRequested,
      });
      return;
    }
  }

  registerOnAcceptHook(hook: OnAcceptHook) {
    this._onAcceptHooks.push(hook);
  }
}
