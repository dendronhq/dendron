import {
  ConfigUtils,
  DNodeUtils,
  InvalidFilenameReason,
  LookupEvents,
  NoteLookupUtils,
  NoteProps,
  NoteQuickInput,
  NoteUtils,
  SchemaUtils,
  VSCodeEvents,
} from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import { HistoryService } from "@dendronhq/engine-server";
import _ from "lodash";
import { CancellationTokenSource, window } from "vscode";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { Logger } from "../../logger";
import { AnalyticsUtils } from "../../utils/analytics";
import { NotePickerUtils } from "./NotePickerUtils";
import { IDendronQuickInputButton } from "./ButtonTypes";
import { CREATE_NEW_NOTE_DETAIL } from "./constants";
import {
  ILookupProviderOptsV3,
  ILookupProviderV3,
  NoteLookupProviderSuccessResp,
  OnAcceptHook,
  OnUpdatePickerItemsOpts,
} from "./LookupProviderV3Interface";
import { DendronQuickPickerV2, DendronQuickPickState } from "./types";
import {
  OldNewLocation,
  PickerUtilsV2,
  shouldBubbleUpCreateNew,
  sortBySimilarity,
} from "./utils";

export class NoteLookupProvider implements ILookupProviderV3 {
  private _onAcceptHooks: OnAcceptHook[];
  public opts: ILookupProviderOptsV3;
  private extension: IDendronExtension;

  constructor(
    public id: string,
    opts: ILookupProviderOptsV3,
    extension: IDendronExtension
  ) {
    this.extension = extension;
    this._onAcceptHooks = [];
    this.opts = opts;
  }

  async provide(opts: {
    quickpick: DendronQuickPickerV2;
    token: CancellationTokenSource;
    fuzzThreshold: number;
  }) {
    const ctx = "NoteLookupProvider.provide";
    Logger.info({ ctx, msg: "enter" });

    const { quickpick, token } = opts;
    const onUpdatePickerItems = _.bind(this.onUpdatePickerItems, this);
    const onUpdateDebounced = _.debounce(
      () => {
        const ctx = "NoteLookupProvider.onUpdateDebounced";
        Logger.debug({ ctx, msg: "enter" });
        const out = onUpdatePickerItems({
          picker: quickpick,
          token: token.token,
        } as OnUpdatePickerItemsOpts);
        Logger.debug({ ctx, msg: "exit" });
        return out;
      },
      100,
      {
        // Use trailing to make sure we get the latest letters typed by the user
        // before accepting.
        leading: false,
      }
    );
    quickpick.onDidChangeValue(onUpdateDebounced);

    quickpick.onDidAccept(async () => {
      Logger.info({
        ctx: "NoteLookupProvider:onDidAccept",
        quickpick: quickpick.value,
      });
      await onUpdateDebounced.flush();
      if (_.isEmpty(quickpick.selectedItems)) {
        await onUpdatePickerItems({
          picker: quickpick,
          token: new CancellationTokenSource().token,
        });
      }
      this.onDidAccept({ quickpick, cancellationToken: token })();
    });
    Logger.info({ ctx, msg: "exit" });
    return;
  }

  shouldRejectItem(opts: { item: NoteQuickInput }):
    | {
        shouldReject: true;
        reason: InvalidFilenameReason;
      }
    | {
        shouldReject: false;
        reason?: never;
      } {
    const { item } = opts;
    const result = NoteUtils.validateFname(item.fname);
    const shouldReject =
      !result.isValid && PickerUtilsV2.isCreateNewNotePicked(item);
    if (shouldReject) {
      return {
        shouldReject,
        reason: result.reason,
      };
    } else {
      return {
        shouldReject,
      };
    }
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
      const ctx = "NoteLookupProvider:onDidAccept";
      const { quickpick: picker, cancellationToken } = opts;

      picker.buttons.forEach((button) => {
        AnalyticsUtils.track(LookupEvents.LookupModifiersSetOnAccept, {
          command: this.id,
          type: (button as IDendronQuickInputButton).type,
          pressed: (button as IDendronQuickInputButton).pressed,
        });
      });

      let selectedItems = NotePickerUtils.getSelection(picker);
      const { preAcceptValidators } = this.opts;
      if (preAcceptValidators) {
        const isValid = preAcceptValidators.every((validator) => {
          return validator(selectedItems);
        });
        if (!isValid) return;
      }
      Logger.debug({
        ctx,
        selectedItems: selectedItems.map((item) => NoteUtils.toLogObj(item)),
      });
      // NOTE: if user presses <ENTER> before picker has a chance to process, this will be `[]`
      // In this case we want to calculate picker item from current value
      if (_.isEmpty(selectedItems)) {
        selectedItems = await NotePickerUtils.fetchPickerResultsNoInput({
          picker,
        });
      }

      // validates fname.
      if (selectedItems.length === 1) {
        const item = selectedItems[0];
        const result = this.shouldRejectItem({ item });
        if (result.shouldReject) {
          window.showErrorMessage(result.reason);
          return;
        }
      }

      // when doing lookup, opening existing notes don't require vault picker
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
      // last chance to cancel
      cancellationToken.cancel();

      if (!this.opts.noHidePickerOnAccept) {
        picker.state = DendronQuickPickState.FULFILLED;
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
          } as NoteLookupProviderSuccessResp<OldNewLocation>,
        });
      }
    };
  }

  //  ^hlj1vvw48s2v
  async onUpdatePickerItems(opts: OnUpdatePickerItemsOpts) {
    const { picker, token, fuzzThreshold } = opts;
    const ctx = "updatePickerItems";
    picker.busy = true;
    let pickerValue = picker.value;
    const start = process.hrtime();

    // Just activated picker's have special behavior:
    //
    // We slice the postfix off until the first dot to show all results at the same
    // level so that when a user types `foo.one`, they will see all results in `foo.*`
    if (
      picker._justActivated &&
      !picker.nonInteractive &&
      !this.opts.forceAsIsPickerValueUsage
    ) {
      pickerValue = NoteLookupUtils.getQsForCurrentLevel(pickerValue);
    }

    const transformedQuery = NoteLookupUtils.transformQueryString({
      query: pickerValue,
      onlyDirectChildren: picker.showDirectChildrenOnly,
    });

    const queryOrig = NoteLookupUtils.slashToDot(picker.value);
    const ws = this.extension.getDWorkspace();
    let profile: number;
    const queryUpToLastDot =
      queryOrig.lastIndexOf(".") >= 0
        ? queryOrig.slice(0, queryOrig.lastIndexOf("."))
        : undefined;

    const engine = ws.engine;
    Logger.info({
      ctx,
      msg: "enter",
      queryOrig,
      justActivated: picker._justActivated,
      prevQuickpickValue: picker.prevQuickpickValue,
    });

    try {
      if (picker.value === picker.prevQuickpickValue) {
        if (!opts.forceUpdate) {
          Logger.debug({ ctx, msg: "picker value did not change" });
          return;
        }
      }

      if (picker.itemsFromSelection) {
        picker.items = picker.itemsFromSelection;
        if (picker.selectAll) {
          picker.selectedItems = picker.items;
        }
        return;
      }

      // if empty string, show all 1st level results
      if (transformedQuery.queryString === "") {
        Logger.debug({ ctx, msg: "empty qs" });
        const items = await NotePickerUtils.fetchRootQuickPickResults({
          engine,
        });
        const extraItems = this.opts.extraItems;
        if (extraItems) {
          items.unshift(...extraItems);
        }
        picker.items = items;
        return;
      }

      // initialize with current picker items without default items present
      const items: NoteQuickInput[] = [...picker.items];
      let updatedItems = PickerUtilsV2.filterDefaultItems(items);
      if (token?.isCancellationRequested) {
        return;
      }

      updatedItems = await NotePickerUtils.fetchPickerResults({
        picker,
        transformedQuery,
        originalQS: queryOrig,
      });

      if (token?.isCancellationRequested) {
        return;
      }

      // check if single item query, vscode doesn't surface single letter queries
      // we need this so that suggestions will show up
      // TODO: this might be buggy since we don't apply filter middleware
      if (
        picker.activeItems.length === 0 &&
        transformedQuery.queryString.length === 1
      ) {
        picker.items = updatedItems;
        picker.activeItems = picker.items;
        return;
      }

      // add schema completions
      if (
        !_.isUndefined(queryUpToLastDot) &&
        !transformedQuery.wasMadeFromWikiLink
      ) {
        const results = await SchemaUtils.matchPath({
          notePath: queryUpToLastDot,
          engine,
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
          let candidatesToAdd = _.differenceBy(
            candidates,
            updatedItems,
            (ent) => ent.fname
          );
          const { wsRoot, vaults } = this.extension.getDWorkspace();

          candidatesToAdd = sortBySimilarity(
            candidatesToAdd,
            transformedQuery.originalQuery
          );

          const itemsToAdd = await Promise.all(
            candidatesToAdd.map(async (ent) => {
              return DNodeUtils.enhancePropForQuickInputV3({
                wsRoot,
                props: ent,
                schema: ent.schema
                  ? (await engine.getSchema(ent.schema.moduleId)).data
                  : undefined,
                vaults,
              });
            })
          );
          updatedItems = updatedItems.concat(itemsToAdd);
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

      // If each of the vaults in the workspace already have exact match of the file name
      // then we should not allow create new option.
      const queryOrigLowerCase = queryOrig.toLowerCase();
      const numberOfExactMatches = updatedItems.filter(
        (item) => item.fname.toLowerCase() === queryOrigLowerCase
      ).length;
      const vaultsHaveSpaceForExactMatch =
        this.extension.getDWorkspace().engine.vaults.length >
        numberOfExactMatches;

      const shouldAddCreateNew =
        // sometimes lookup is in mode where new notes are not allowed (eg. move an existing note, this option is manually passed in)
        this.opts.allowNewNote &&
        // notes can't end with dot, invalid note
        !queryOrig.endsWith(".") &&
        // if you can select mult notes, new note is not valid
        !picker.canSelectMany &&
        // when you create lookup from selection, new note is not valid
        !transformedQuery.wasMadeFromWikiLink &&
        vaultsHaveSpaceForExactMatch;

      if (shouldAddCreateNew) {
        const entryCreateNew = NotePickerUtils.createNoActiveItem({
          fname: queryOrig,
          detail: CREATE_NEW_NOTE_DETAIL,
        });
        const newItems = [entryCreateNew];

        // should not add `Create New with Template` if the quickpick
        // 1. has an onCreate defined (i.e. task note), or
        const onCreateDefined = picker.onCreate !== undefined;

        const shouldAddCreateNewWithTemplate =
          this.opts.allowNewNoteWithTemplate && !onCreateDefined;
        if (shouldAddCreateNewWithTemplate) {
          const entryCreateNewWithTemplate =
            NotePickerUtils.createNewWithTemplateItem({
              fname: queryOrig,
            });
          newItems.push(entryCreateNewWithTemplate);
        }

        const bubbleUpCreateNew = ConfigUtils.getLookup(ws.config).note
          .bubbleUpCreateNew;
        if (
          shouldBubbleUpCreateNew({
            numberOfExactMatches,
            querystring: queryOrig,
            bubbleUpCreateNew,
          })
        ) {
          updatedItems = newItems.concat(updatedItems);
        } else {
          updatedItems = updatedItems.concat(newItems);
        }
      }

      // check fuzz threshold. tune fuzzyness. currently hardcoded
      // TODO: in the future this should be done in the engine
      if (fuzzThreshold === 1) {
        updatedItems = updatedItems.filter((ent) => ent.fname === picker.value);
      }

      // We do NOT want quick pick to filter out items since it does not match with FuseJS.
      updatedItems.forEach((item) => {
        item.alwaysShow = true;
      });

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
        numItems: picker.items.length,
        cancelled: token?.isCancellationRequested,
      });
      AnalyticsUtils.track(VSCodeEvents.NoteLookup_Update, {
        duration: profile,
      });
      return; // eslint-disable-line no-unsafe-finally -- probably can be just removed
    }
  }

  registerOnAcceptHook(hook: OnAcceptHook) {
    this._onAcceptHooks.push(hook);
  }
}
