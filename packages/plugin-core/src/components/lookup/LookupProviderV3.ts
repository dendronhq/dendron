import {
  ConfigUtils,
  DNodePropsQuickInputV2,
  DNodeUtils,
  FuseEngine,
  NoteLookupUtils,
  NoteProps,
  NoteQuickInput,
  NoteUtils,
  RespV2,
  SchemaModuleProps,
  SchemaQuickInput,
  SchemaUtils,
  VSCodeEvents,
} from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import { HistoryService } from "@dendronhq/engine-server";
import _ from "lodash";
import { CancellationToken, CancellationTokenSource, window } from "vscode";
import { Logger } from "../../logger";
import { AnalyticsUtils } from "../../utils/analytics";
import { getDWorkspace } from "../../workspace";
import { LookupControllerV3 } from "./LookupControllerV3";
import { DendronQuickPickerV2, DendronQuickPickState } from "./types";
import {
  NotePickerUtils,
  OldNewLocation,
  PickerUtilsV2,
  SchemaPickerUtils,
} from "./utils";
import { transformQueryString } from "./queryStringTransformer";
import stringSimilarity from "string-similarity";

export type OnUpdatePickerItemsOpts = {
  picker: DendronQuickPickerV2;
  token: CancellationToken;
  fuzzThreshold?: number;
  /**
   * force update even if picker vaule didn't change
   */
  forceUpdate?: boolean;
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
  /** Forces to use picker value as is when constructing the query string. */
  forceAsIsPickerValueUsage?: boolean;
  /**
   * Extra items to show in picker.
   * This will always be shown at the top
   * when (and only when) nothing is queried.
   */
  extraItems?: DNodePropsQuickInputV2[];
};

export type NoteLookupProviderSuccessResp<T = never> = {
  selectedItems: readonly NoteQuickInput[];
  onAcceptHookResp: T[];
  cancel?: boolean;
};
export type NoteLookupProviderChangeStateResp = {
  action: "hide";
};

export type SchemaLookupProviderSuccessResp<T = never> = {
  selectedItems: readonly SchemaQuickInput[];
  onAcceptHookResp: T[];
  cancel?: boolean;
};

/** This function presumes that 'CreateNew' should be shown and determines whether
 *  CreateNew should be at the top of the look up results or not. */
export function shouldBubbleUpCreateNew({
  numberOfExactMatches,
  querystring,
  bubbleUpCreateNew,
}: {
  numberOfExactMatches: number;
  querystring: string;
  bubbleUpCreateNew?: boolean;
}) {
  // We don't want to bubble up create new if there is an exact match since
  // vast majority of times if there is an exact match user wants to navigate to it
  // rather than create a new file with exact same file name in different vault.
  const noExactMatches = numberOfExactMatches === 0;

  // Note: one of the special characters is space/' ' which for now we want to allow
  // users to make the files with ' ' in them but we won't bubble up the create new
  // option for the special characters, including space. The more contentious part
  // about previous/current behavior is that we allow creation of files with
  // characters like '$' which FuseJS will not match (Meaning '$' will NOT match 'hi$world').
  const noSpecialQueryChars =
    !FuseEngine.doesContainSpecialQueryChars(querystring);

  if (_.isUndefined(bubbleUpCreateNew)) bubbleUpCreateNew = true;

  return noSpecialQueryChars && noExactMatches && bubbleUpCreateNew;
}

/**
 * Sorts the given candidates notes by similarity to the query string in
 * descending order (the most similar come first) */
export function sortBySimilarity(candidates: NoteProps[], query: string) {
  return (
    candidates
      // To avoid duplicate similarity score calculation we will first map
      // to have the similarity score cached and then sort using cached value.
      .map((cand) => ({
        cand,
        similarityScore: stringSimilarity.compareTwoStrings(cand.fname, query),
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .map((v) => v.cand)
  );
}

export class NoteLookupProvider implements ILookupProviderV3 {
  private _onAcceptHooks: OnAcceptHook[];
  public opts: ILookupProviderOptsV3;

  constructor(public id: string, opts: ILookupProviderOptsV3) {
    this._onAcceptHooks = [];
    this.opts = opts;
  }

  async provide(lc: LookupControllerV3) {
    const ctx = "NoteLookupProvider.provide";
    Logger.info({ ctx, msg: "enter" });
    const quickpick = lc.quickpick;
    const onUpdatePickerItems = _.bind(this.onUpdatePickerItems, this);
    const onUpdateDebounced = _.debounce(
      () => {
        const ctx = "NoteLookupProvider.onUpdateDebounced";
        Logger.debug({ ctx, msg: "enter" });
        const out = onUpdatePickerItems({
          picker: quickpick,
          token: lc.createCancelSource().token,
          fuzzThreshold: lc.fuzzThreshold,
        } as OnUpdatePickerItemsOpts);
        Logger.debug({ ctx, msg: "exit" });
        return out;
      },
      100,
      {
        leading: true,
      }
    );
    quickpick.onDidChangeValue(onUpdateDebounced);

    quickpick.onDidAccept(async () => {
      Logger.info({
        ctx: "NoteLookupProvider:onDidAccept",
        quickpick: quickpick.value,
      });
      onUpdateDebounced.cancel();
      if (_.isEmpty(quickpick.selectedItems)) {
        await onUpdatePickerItems({
          picker: quickpick,
          token: new CancellationTokenSource().token,
          fuzzThreshold: lc.fuzzThreshold,
        });
      }
      this.onDidAccept({ quickpick, lc })();
    });
    Logger.info({ ctx, msg: "exit" });
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
      const ctx = "NoteLookupProvider:onDidAccept";
      const { quickpick: picker, lc } = opts;
      let selectedItems = NotePickerUtils.getSelection(picker);
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
      lc.cancelToken.cancel();
      if (!this.opts.noHidePickerOnAccept) {
        picker.state = DendronQuickPickState.FULFILLED;
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

    const transformedQuery = transformQueryString({
      pickerValue,
      onlyDirectChildren: picker.showDirectChildrenOnly,
    });

    const queryOrig = PickerUtilsV2.slashToDot(picker.value);
    const ws = getDWorkspace();
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
        return;
      }

      // if empty string, show all 1st level results
      if (transformedQuery.queryString === "") {
        Logger.debug({ ctx, msg: "empty qs" });
        const items = NotePickerUtils.fetchRootQuickPickResults({ engine });
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
      if (token.isCancellationRequested) {
        return;
      }

      updatedItems = await NotePickerUtils.fetchPickerResults({
        picker,
        transformedQuery,
        originalQS: queryOrig,
      });

      if (token.isCancellationRequested) {
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
          let candidatesToAdd = _.differenceBy(
            candidates,
            updatedItems,
            (ent) => ent.fname
          );
          const { wsRoot, vaults } = getDWorkspace();

          candidatesToAdd = sortBySimilarity(
            candidatesToAdd,
            transformedQuery.originalQuery
          );

          updatedItems = updatedItems.concat(
            candidatesToAdd.map((ent) => {
              return DNodeUtils.enhancePropForQuickInputV3({
                wsRoot,
                props: ent,
                schemas: engine.schemas,
                vaults,
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

      // If each of the vaults in the workspace already have exact match of the file name
      // then we should not allow create new option.
      const queryOrigLowerCase = queryOrig.toLowerCase();
      const numberOfExactMatches = updatedItems.filter(
        (item) => item.fname.toLowerCase() === queryOrigLowerCase
      ).length;
      const vaultsHaveSpaceForExactMatch =
        getDWorkspace().engine.vaults.length > numberOfExactMatches;

      const shouldAddCreateNew =
        this.opts.allowNewNote &&
        !queryOrig.endsWith(".") &&
        !picker.canSelectMany &&
        !transformedQuery.wasMadeFromWikiLink &&
        vaultsHaveSpaceForExactMatch;

      if (shouldAddCreateNew) {
        const entryCreateNew = NotePickerUtils.createNoActiveItem({
          fname: queryOrig,
        });

        const bubbleUpCreateNew = ConfigUtils.getLookup(ws.config).note
          .bubbleUpCreateNew;
        if (
          shouldBubbleUpCreateNew({
            numberOfExactMatches,
            querystring: queryOrig,
            bubbleUpCreateNew,
          })
        ) {
          updatedItems = [entryCreateNew, ...updatedItems];
        } else {
          updatedItems = [...updatedItems, entryCreateNew];
        }
      }

      // check fuzz threshold. tune fuzzyness. currently hardcoded
      // TODO: in the future this should be done in the engine
      if (opts.fuzzThreshold === 1) {
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
        cancelled: token.isCancellationRequested,
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
          fuzzThreshold: lc.fuzzThreshold,
        });
      }
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
      const ctx = "SchemaLookupProvider:onDidAccept";
      const { quickpick: picker, lc } = opts;
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
    const ws = getDWorkspace();
    let profile: number;

    const engine = ws.engine;
    Logger.info({ ctx, msg: "enter", queryOrig });
    try {
      // if empty string, show all 1st level results
      if (querystring === "") {
        Logger.debug({ ctx, msg: "empty qs" });
        const nodes = _.map(
          _.values(engine.schemas),
          (ent: SchemaModuleProps) => {
            return SchemaUtils.getModuleRoot(ent);
          }
        );
        picker.items = nodes.map((ent) => {
          return DNodeUtils.enhancePropForQuickInputV3({
            wsRoot: getDWorkspace().wsRoot,
            props: ent,
            schemas: engine.schemas,
            vaults: ws.vaults,
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
      });
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
        this.opts.allowNewNote && !perfectMatch
          ? updatedItems.concat([
              NotePickerUtils.createNoActiveItem({ fname: querystring }),
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
        cancelled: token.isCancellationRequested,
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
