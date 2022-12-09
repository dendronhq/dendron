import {
  DNodeUtils,
  NoteLookupUtils,
  NoteQuickInputV2,
  TransformedQueryString,
  type ReducedDEngine,
} from "@dendronhq/common-all";
import { inject, injectable } from "tsyringe";
import { window } from "vscode";
import {
  ILookupProvider,
  provideItemsProps,
  workspaceState,
} from "./ILookupProvider";

/**
 * Provides Note Lookup results by querying the engine.
 */
@injectable()
export class NoteLookupProvider implements ILookupProvider {
  constructor(@inject("ReducedDEngine") private engine: ReducedDEngine) {}

  async provideItems(opts: provideItemsProps): Promise<NoteQuickInputV2[]> {
    const { token, showDirectChildrenOnly, workspaceState } = opts;

    const { pickerValue } = opts;
    const transformedQuery = NoteLookupUtils.transformQueryString({
      query: pickerValue,
      onlyDirectChildren: showDirectChildrenOnly,
    });

    const queryOrig = NoteLookupUtils.slashToDot(pickerValue);

    // const queryUpToLastDot =
    //   queryOrig.lastIndexOf(".") >= 0
    //     ? queryOrig.slice(0, queryOrig.lastIndexOf("."))
    //     : undefined;

    try {
      // if empty string, show all 1st level results
      if (transformedQuery.queryString === "") {
        return this.fetchRootQuickPickResults();
      }

      // const items: NoteQuickInput[] = [...picker.items];
      // let updatedItems = PickerUtilsV2.filterDefaultItems(items);
      if (token?.isCancellationRequested) {
        return [];
      }

      const updatedItems = await this.fetchPickerResults({
        transformedQuery,
        originalQS: queryOrig,
        workspaceState,
      });

      if (token?.isCancellationRequested) {
        return [];
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
      // if (
      //   !_.isUndefined(queryUpToLastDot) &&
      //   !transformedQuery.wasMadeFromWikiLink
      // ) {
      //   const results = SchemaUtils.matchPath({
      //     notePath: queryUpToLastDot,
      //     schemaModDict: workspaceState.schemas,
      //   });
      //   // since namespace matches everything, we don't do queries on that
      //   if (results && !results.namespace) {
      //     const { schema, schemaModule } = results;
      //     const dirName = queryUpToLastDot;
      //     const candidates = schema.children
      //       .map((ent) => {
      //         const mschema = schemaModule.schemas[ent];
      //         if (
      //           SchemaUtils.hasSimplePattern(mschema, {
      //             isNotNamespace: true,
      //           })
      //         ) {
      //           const pattern = SchemaUtils.getPattern(mschema, {
      //             isNotNamespace: true,
      //           });
      //           const fname = [dirName, pattern].join(".");
      //           return NoteUtils.fromSchema({
      //             schemaModule,
      //             schemaId: ent,
      //             fname,
      //             vault: workspaceState.vaults[0], // TODO: Fix
      //             // vault: PickerUtilsV2.getVaultForOpenEditor(),
      //           });
      //         }
      //         return;
      //       })
      //       .filter(Boolean) as NoteProps[];
      //     let candidatesToAdd = _.differenceBy(
      //       candidates,
      //       updatedItems,
      //       (ent) => ent.fname
      //     );

      //     candidatesToAdd = this.sortBySimilarity(
      //       candidatesToAdd,
      //       transformedQuery.originalQuery
      //     );

      //     updatedItems = updatedItems.concat(
      //       candidatesToAdd.map((ent) => {
      //         return DNodeUtils.enhancePropForQuickInputV4({
      //           props: ent,
      //         });
      //       })
      //     );
      //   }
      // }

      // We do NOT want quick pick to filter out items since it does not match with FuseJS.
      updatedItems.forEach((item) => {
        item.alwaysShow = true;
      });

      return updatedItems;
    } catch (err: any) {
      window.showErrorMessage(err);
      throw Error(err);
    }
  }

  private fetchRootQuickPickResults = async () => {
    const nodes = await NoteLookupUtils.fetchRootResultsFromEngine(this.engine);

    return nodes.map((ent) => {
      return DNodeUtils.enhancePropForQuickInputV4({
        props: ent,
      });
    });
  };

  private async fetchPickerResults(opts: {
    transformedQuery: TransformedQueryString;
    originalQS: string;
    workspaceState: workspaceState;
  }) {
    const { transformedQuery, originalQS } = opts;

    const nodes = await this.engine.queryNotesMeta({
      qs: transformedQuery.queryString,
      onlyDirectChildren: transformedQuery.onlyDirectChildren,
      originalQS,
    });

    return Promise.all(
      nodes.map(async (ent) =>
        DNodeUtils.enhancePropForQuickInputV4({
          props: ent,
        })
      )
    );
  }

  // /**
  //  * Sorts the given candidates notes by similarity to the query string in
  //  * descending order (the most similar come first) */
  // private sortBySimilarity(candidates: NoteProps[], query: string) {
  //   return (
  //     candidates
  //       // To avoid duplicate similarity score calculation we will first map
  //       // to have the similarity score cached and then sort using cached value.
  //       .map((cand) => ({
  //         cand,
  //         similarityScore: stringSimilarity.compareTwoStrings(
  //           cand.fname,
  //           query
  //         ),
  //       }))
  //       .sort((a, b) => b.similarityScore - a.similarityScore)
  //       .map((v) => v.cand)
  //   );
  // }
}
