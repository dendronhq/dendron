import {
  DNodeUtils,
  NoteLookupUtils,
  NoteQuickInput,
  NoteUtils,
  SchemaModuleProps,
  SchemaUtils,
  VSCodeEvents,
} from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import { HistoryService } from "@dendronhq/engine-server";
import _ from "lodash";
import { CancellationTokenSource, window } from "vscode";
import { NoteLookupCommand } from "../../commands/NoteLookupCommand";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { Logger } from "../../logger";
import { AnalyticsUtils } from "../../utils/analytics";
import { NotePickerUtils } from "../lookup/NotePickerUtils";
import { SchemaPickerUtils } from "../lookup/SchemaPickerUtils";
import { CREATE_NEW_SCHEMA_DETAIL } from "./constants";
import {
  ILookupProviderOptsV3,
  ILookupProviderV3,
  OnAcceptHook,
  OnUpdatePickerItemsOpts,
  ProvideOpts,
  SchemaLookupProviderSuccessResp,
} from "./LookupProviderV3Interface";
import { DendronQuickPickerV2, DendronQuickPickState } from "./types";
import { OldNewLocation, PickerUtilsV2 } from "./utils";

export class SchemaLookupProvider implements ILookupProviderV3 {
  private _extension: IDendronExtension;
  private _onAcceptHooks: OnAcceptHook[];
  public opts: ILookupProviderOptsV3;

  constructor(
    public id: string,
    opts: ILookupProviderOptsV3,
    extension: IDendronExtension
  ) {
    this._extension = extension;
    this._onAcceptHooks = [];
    this.opts = opts;
  }

  async provide(opts: ProvideOpts) {
    const { quickpick, token } = opts;

    const onUpdatePickerItems = _.bind(this.onUpdatePickerItems, this);
    const onUpdateDebounced = _.debounce(
      () => {
        onUpdatePickerItems({
          picker: quickpick,
          token: token.token,
        } as OnUpdatePickerItemsOpts);
      },
      100,
      {
        leading: true,
        maxWait: 200,
      }
    );
    quickpick.onDidChangeValue(onUpdateDebounced);
    quickpick.onDidAccept(async () => {
      Logger.info({
        ctx: "SchemaLookupProvider:onDidAccept",
        quickpick: quickpick.value,
      });
      onUpdateDebounced.cancel();
      if (_.isEmpty(quickpick.selectedItems)) {
        await onUpdatePickerItems({
          picker: quickpick,
          token: new CancellationTokenSource().token,
        });
      }
      this.onDidAccept({ quickpick, cancellationToken: token })();
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
    cancellationToken: CancellationTokenSource;
  }) {
    return async () => {
      const ctx = "SchemaLookupProvider:onDidAccept";
      const { quickpick: picker, cancellationToken } = opts;
      let selectedItems = NotePickerUtils.getSelection(picker);
      Logger.debug({
        ctx,
        selectedItems: selectedItems.map((item) => NoteUtils.toLogObj(item)),
      });
      if (_.isEmpty(selectedItems)) {
        selectedItems =
          await SchemaPickerUtils.fetchPickerResultsWithCurrentValue({
            picker,
          });
      }
      if (
        PickerUtilsV2.hasNextPicker(picker, {
          selectedItems,
          providerId: this.id,
        })
      ) {
        Logger.debug({ ctx, msg: "nextPicker:pre" });
        picker.state = DendronQuickPickState.PENDING_NEXT_PICK;

        picker.vault = await picker.nextPicker({ note: selectedItems[0] });
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
      const isMultiLevel = picker.value.split(".").length > 1;
      if (isMultiLevel) {
        window
          .showInformationMessage(
            "It looks like you are trying to create a multi-level [schema](https://wiki.dendron.so/notes/c5e5adde-5459-409b-b34d-a0d75cbb1052.html). This is not supported. If you are trying to create a note instead, run the `> Note Lookup` command or click on `Note Lookup`",
            ...["Note Lookup"]
          )
          .then(async (selection) => {
            if (selection === "Note Lookup") {
              await new NoteLookupCommand().run({
                initialValue: picker.value,
              });
            }
          });

        HistoryService.instance().add({
          source: "lookupProvider",
          action: "done",
          id: this.id,
          data: { cancel: true },
        });
        return;
      }
      // last chance to cancel
      cancellationToken.cancel();
      if (!this.opts.noHidePickerOnAccept) {
        picker.hide();
      }
      const onAcceptHookResp = await Promise.all(
        this._onAcceptHooks.map((hook) =>
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
    const querystring = NoteLookupUtils.slashToDot(pickerValue);
    const queryOrig = NoteLookupUtils.slashToDot(picker.value);
    const ws = this._extension.getDWorkspace();
    let profile: number;

    const engine = ws.engine;
    Logger.info({ ctx, msg: "enter", queryOrig });
    try {
      // if empty string, show all 1st level results
      if (querystring === "") {
        Logger.debug({ ctx, msg: "empty qs" });
        const nodes = _.map(
          _.values((await engine.querySchema("*")).data),
          (ent: SchemaModuleProps) => {
            return SchemaUtils.getModuleRoot(ent);
          }
        );
        picker.items = await Promise.all(
          nodes.map(async (ent) => {
            return DNodeUtils.enhancePropForQuickInputV3({
              wsRoot: this._extension.getDWorkspace().wsRoot,
              props: ent,
              schema: ent.schema
                ? (await engine.getSchema(ent.schema.moduleId)).data
                : undefined,
              vaults: ws.vaults,
            });
          })
        );
        return;
      }

      // initialize with current picker items without default items present
      const items: NoteQuickInput[] = [...picker.items];
      let updatedItems = PickerUtilsV2.filterDefaultItems(items);
      if (token?.isCancellationRequested) {
        return;
      }

      // if we entered a different level of hierarchy, re-run search
      updatedItems = await SchemaPickerUtils.fetchPickerResults({
        picker,
        qs: querystring,
      });
      if (token?.isCancellationRequested) {
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
        this.opts.allowNewNote && !perfectMatch
          ? updatedItems.concat([
              NotePickerUtils.createNoActiveItem({
                fname: querystring,
                detail: CREATE_NEW_SCHEMA_DETAIL,
              }),
            ])
          : updatedItems;

      picker.items = updatedItems;
    } catch (err: any) {
      window.showErrorMessage(err);
      throw Error(err);
    } finally {
      profile = getDurationMilliseconds(start);
      picker.busy = false;
      picker._justActivated = false;
      picker.prevValue = picker.value;
      picker.prevQuickpickValue = picker.value;
      Logger.info({
        ctx,
        msg: "exit",
        queryOrig,
        profile,
        cancelled: token?.isCancellationRequested,
      });
      AnalyticsUtils.track(VSCodeEvents.SchemaLookup_Update, {
        duration: profile,
      });
      return; // eslint-disable-line no-unsafe-finally -- probably can be just removed
    }
  }

  registerOnAcceptHook(hook: OnAcceptHook) {
    this._onAcceptHooks.push(hook);
  }
}
