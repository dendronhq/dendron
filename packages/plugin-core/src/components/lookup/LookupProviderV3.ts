import {
  ConfigUtils,
  DNodeUtils,
  FuseEngine,
  LookupEvents,
  NoteLookupUtils,
  NoteProps,
  NoteQuickInput,
  NoteUtils,
  SchemaModuleProps,
  SchemaUtils,
  VSCodeEvents,
} from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import { HistoryService } from "@dendronhq/engine-server";
import _ from "lodash";
import stringSimilarity from "string-similarity";
import { CancellationTokenSource, window } from "vscode";
import { NoteLookupCommand } from "../../commands/NoteLookupCommand";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { Logger } from "../../logger";
import { AnalyticsUtils } from "../../utils/analytics";
import { NotePickerUtils } from "../lookup/NotePickerUtils";
import { SchemaPickerUtils } from "../lookup/SchemaPickerUtils";
import { IDendronQuickInputButton } from "./ButtonTypes";
import { CREATE_NEW_NOTE_DETAIL, CREATE_NEW_SCHEMA_DETAIL } from "./constants";
import {
  ILookupProviderOptsV3,
  ILookupProviderV3,
  NoteLookupProviderSuccessResp,
  OnAcceptHook,
  OnUpdatePickerItemsOpts,
  ProvideOpts,
  SchemaLookupProviderSuccessResp,
} from "./LookupProviderV3Interface";
import { transformQueryString } from "./queryStringTransformer";
import { DendronQuickPickerV2, DendronQuickPickState } from "./types";
import { OldNewLocation, PickerUtilsV2 } from "./utils";

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

    const { quickpick, token, fuzzThreshold } = opts;
    const onUpdatePickerItems = _.bind(this.onUpdatePickerItems, this);
    const onUpdateDebounced = _.debounce(
      () => {
        const ctx = "NoteLookupProvider.onUpdateDebounced";
        Logger.debug({ ctx, msg: "enter" });
        const out = onUpdatePickerItems({
          picker: quickpick,
          token: token.token,
          fuzzThreshold,
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
          fuzzThreshold,
        });
      }
      this.onDidAccept({ quickpick, cancellationToken: token })();
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
          const { wsRoot, vaults } = this.extension.getDWorkspace();

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
    const { quickpick, token, fuzzThreshold } = opts;

    const onUpdatePickerItems = _.bind(this.onUpdatePickerItems, this);
    const onUpdateDebounced = _.debounce(
      () => {
        onUpdatePickerItems({
          picker: quickpick,
          token: token.token,
          fuzzThreshold,
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
          fuzzThreshold,
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
    const querystring = PickerUtilsV2.slashToDot(pickerValue);
    const queryOrig = PickerUtilsV2.slashToDot(picker.value);
    const ws = this._extension.getDWorkspace();
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
            wsRoot: this._extension.getDWorkspace().wsRoot,
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
