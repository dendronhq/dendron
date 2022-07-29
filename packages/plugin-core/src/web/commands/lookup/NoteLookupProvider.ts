import {
  DNodeProps,
  DNodeUtils,
  DVault,
  NoteLookupUtils,
  NoteProps,
  NoteQuickInput,
  NoteUtils,
  SchemaModuleDict,
  SchemaUtils,
  TransformedQueryString,
} from "@dendronhq/common-all";
import _ from "lodash";
import { IReducedEngineAPIService } from "@dendronhq/plugin-common";
import stringSimilarity from "string-similarity";
import { window } from "vscode";
import { ILookupProvider, provideItemsProps } from "./ILookupProvider";

// type FilterQuickPickFunction = (items: NoteQuickInput[]) => NoteQuickInput[];

export class NoteLookupProvider implements ILookupProvider {
  // TODO: Use DI
  constructor(private engine: IReducedEngineAPIService) {
    console.log("inside constructor");
  }

  async provideItems(
    opts: provideItemsProps // TODO: Check the type parameter
  ): Promise<NoteQuickInput[] | undefined> {
    const { token, fuzzThreshold, showDirectChildrenOnly, workspaceState } =
      opts;

    // debugger;
    const { pickerValue } = opts;

    // Just activated picker's have special behavior:
    //
    // We slice the postfix off until the first dot to show all results at the same
    // level so that when a user types `foo.one`, they will see all results in `foo.*`
    // if (_justActivated) {
    //   pickerValue = NoteLookupUtils.getQsForCurrentLevel(pickerValue);
    // }

    const transformedQuery = NoteLookupUtils.transformQueryString({
      query: pickerValue,
      onlyDirectChildren: showDirectChildrenOnly,
    });

    // debugger;
    const queryOrig = NoteLookupUtils.slashToDot(pickerValue);

    const queryUpToLastDot =
      queryOrig.lastIndexOf(".") >= 0
        ? queryOrig.slice(0, queryOrig.lastIndexOf("."))
        : undefined;

    try {
      // if empty string, show all 1st level results
      if (transformedQuery.queryString === "") {
        // Logger.debug({ ctx, msg: "empty qs" });

        const items = this.fetchRootQuickPickResults({
          wsRoot: workspaceState.wsRoot,
          vaults: workspaceState.vaults,
          schemas: workspaceState.schemas,
        });
        // const extraItems = this.opts.extraItems;
        // if (extraItems) {
        //   items.unshift(...extraItems);
        // }
        // picker.items = items;
        return items;
      }

      // const items: NoteQuickInput[] = [...picker.items];
      // let updatedItems = PickerUtilsV2.filterDefaultItems(items);
      if (token?.isCancellationRequested) {
        return;
      }

      let updatedItems = await this.fetchPickerResults({
        transformedQuery,
        originalQS: queryOrig,
        workspaceState,
      });

      if (token?.isCancellationRequested) {
        return;
      }

      //TODO: Dunno if we still need this?
      // check if single item query, vscode doesn't surface single letter queries
      // we need this so that suggestions will show up
      // TODO: this might be buggy since we don't apply filter middleware
      // if (
      //   picker.activeItems.length === 0 &&
      //   transformedQuery.queryString.length === 1
      // ) {
      //   picker.items = updatedItems;
      //   picker.activeItems = picker.items;
      //   return;
      // }

      // TODO: Clean up Schema Section
      // add schema completions
      if (
        !_.isUndefined(queryUpToLastDot) &&
        !transformedQuery.wasMadeFromWikiLink
      ) {
        const results = SchemaUtils.matchPath({
          notePath: queryUpToLastDot,
          schemaModDict: workspaceState.schemas,
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
                  vault: workspaceState.vaults[0], // TODO: Fix
                  // vault: PickerUtilsV2.getVaultForOpenEditor(),
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

          candidatesToAdd = this.sortBySimilarity(
            candidatesToAdd,
            transformedQuery.originalQuery
          );

          updatedItems = updatedItems.concat(
            candidatesToAdd.map((ent) => {
              return DNodeUtils.enhancePropForQuickInputV3({
                wsRoot: workspaceState.wsRoot,
                props: ent,
                schemas: workspaceState.schemas,
                vaults: workspaceState.vaults,
              });
            })
          );
        }
      }

      // filter the results through optional middleware
      // if (filterMiddleware) {
      //   updatedItems = filterMiddleware(updatedItems);
      // }

      // if new notes are allowed and we didn't get a perfect match, append `Create New` option
      // to picker results
      // NOTE: order matters. we always pick the first item in single select mode
      // Logger.debug({ ctx, msg: "active != qs" });

      // If each of the vaults in the workspace already have exact match of the file name
      // then we should not allow create new option.
      // const queryOrigLowerCase = queryOrig.toLowerCase();
      // const numberOfExactMatches = updatedItems.filter(
      //   (item) => item.fname.toLowerCase() === queryOrigLowerCase
      // ).length;
      // Move this logic to controller:
      // const vaultsHaveSpaceForExactMatch =
      //   workspaceState.vaults.length > numberOfExactMatches;

      // const shouldAddCreateNew =
      //   // sometimes lookup is in mode where new notes are not allowed (eg. move an existing note, this option is manually passed in)
      //   this.opts.allowNewNote &&
      //   // notes can't end with dot, invalid note
      //   !queryOrig.endsWith(".") &&
      //   // if you can select mult notes, new note is not valid
      //   !picker.canSelectMany &&
      //   // when you create lookup from selection, new note is not valid
      //   !transformedQuery.wasMadeFromWikiLink &&
      //   vaultsHaveSpaceForExactMatch;

      // if (shouldAddCreateNew) {
      //   const entryCreateNew = NotePickerUtils.createNoActiveItem({
      //     fname: queryOrig,
      //     detail: CREATE_NEW_NOTE_DETAIL,
      //   });

      //   const bubbleUpCreateNew = ConfigUtils.getLookup(ws.config).note
      //     .bubbleUpCreateNew;
      //   if (
      //     shouldBubbleUpCreateNew({
      //       numberOfExactMatches,
      //       querystring: queryOrig,
      //       bubbleUpCreateNew,
      //     })
      //   ) {
      //     updatedItems = [entryCreateNew, ...updatedItems];
      //   } else {
      //     updatedItems = [...updatedItems, entryCreateNew];
      //   }
      // }

      // check fuzz threshold. tune fuzzyness. currently hardcoded
      // TODO: in the future this should be done in the engine
      if (fuzzThreshold === 1) {
        updatedItems = updatedItems.filter((ent) => ent.fname === pickerValue);
      }

      // We do NOT want quick pick to filter out items since it does not match with FuseJS.
      updatedItems.forEach((item) => {
        item.alwaysShow = true;
      });

      return updatedItems;
      // picker.items = updatedItems;
    } catch (err: any) {
      window.showErrorMessage(err);
      throw Error(err);
    }
    // finally {
    //   profile = getDurationMilliseconds(start);
    //   picker.busy = false;
    //   picker._justActivated = false;
    //   picker.prevValue = picker.value;
    //   picker.prevQuickpickValue = picker.value;
    //   Logger.info({
    //     ctx,
    //     msg: "exit",
    //     queryOrig,
    //     profile,
    //     cancelled: token?.isCancellationRequested,
    //   });
    //   AnalyticsUtils.track(VSCodeEvents.NoteLookup_Update, {
    //     duration: profile,
    //   });
    //   return; // eslint-disable-line no-unsafe-finally -- probably can be just removed
    // }
  }

  private fetchRootQuickPickResults = async ({
    wsRoot,
    schemas,
    vaults,
  }: {
    wsRoot: string;
    schemas: SchemaModuleDict;
    vaults: DVault[];
  }) => {
    // debugger;
    const nodes = await this.fetchRootResults();

    // debugger;
    return nodes.map((ent) => {
      return DNodeUtils.enhancePropForQuickInput({
        wsRoot,
        props: ent,
        schemas,
        vaults,
      });
    });
  };

  private fetchRootResults = async () => {
    //TODO: Change to findNotesMeta
    const roots = await this.engine.findNotes({ fname: "root" });

    const childrenOfRoot = roots.flatMap((ent) => ent.children);
    const childrenOfRootNotes = await Promise.all(
      _.map(childrenOfRoot, (ent) => this.engine.getNote(ent))
    );
    return roots.concat(_.compact(childrenOfRootNotes));
  };

  private async fetchPickerResults(opts: {
    transformedQuery: TransformedQueryString;
    originalQS: string;
    workspaceState: workspaceState;
  }) {
    // const PAGINATE_LIMIT = 50;
    // const ctx = "createPickerItemsFromEngine";
    // const start = process.hrtime();
    const { transformedQuery, originalQS } = opts;
    // const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
    // if we are doing a query, reset pagination options
    // PickerUtilsV2.resetPaginationOpts(picker);

    const resp = await this.engine.queryNotes({
      qs: transformedQuery.queryString,
      onlyDirectChildren: transformedQuery.onlyDirectChildren,
      originalQS,
    });
    // debugger;
    const nodes = resp.data;

    if (!nodes) {
      return [];
    }

    // We need to filter our results to abide by different variations of our
    // transformed query. We should do filtering prior to doing pagination cut off.
    // nodes = filterPickerResults({ itemsToFilter: nodes, transformedQuery });

    // Logger.info({ ctx, msg: "post:queryNotes" });
    // if (nodes.length > PAGINATE_LIMIT) {
    //   picker.allResults = nodes;
    //   // picker.offset = PAGINATE_LIMIT;
    //   // picker.moreResults = true;
    //   nodes = nodes.slice(0, PAGINATE_LIMIT);
    // } else {
    //   PickerUtilsV2.resetPaginationOpts(picker);
    // }

    return Promise.all(
      nodes.map(async (ent) =>
        DNodeUtils.enhancePropForQuickInputV3({
          wsRoot: opts.workspaceState.wsRoot,
          props: ent as DNodeProps<any, any>, // TODO: Error casting
          schemas: opts.workspaceState.schemas,
          vaults: opts.workspaceState.vaults,
        })
      )
    );

    // const profile = getDurationMilliseconds(start);
    // Logger.info({ ctx, msg: "engine.query", profile });
    // return updatedItems;
  }

  /**
   * Sorts the given candidates notes by similarity to the query string in
   * descending order (the most similar come first) */
  private sortBySimilarity(candidates: NoteProps[], query: string) {
    return (
      candidates
        // To avoid duplicate similarity score calculation we will first map
        // to have the similarity score cached and then sort using cached value.
        .map((cand) => ({
          cand,
          similarityScore: stringSimilarity.compareTwoStrings(
            cand.fname,
            query
          ),
        }))
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .map((v) => v.cand)
    );
  }
}
