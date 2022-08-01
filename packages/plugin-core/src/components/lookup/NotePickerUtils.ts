import {
  DEngineClient,
  DNodeProps,
  DNodePropsQuickInputV2,
  DNodeUtils,
  NoteLookupUtils,
  NoteProps,
  NoteQuickInput,
  TransformedQueryString,
} from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import { LinkUtils } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import { ExtensionProvider } from "../../ExtensionProvider";
import { Logger } from "../../logger";
import { VSCodeUtils } from "../../vsCodeUtils";
import { CREATE_NEW_NOTE_DETAIL, CREATE_NEW_LABEL } from "./constants";
import { DendronQuickPickerV2 } from "./types";
import { filterPickerResults, PickerUtilsV2 } from "./utils";

export const PAGINATE_LIMIT = 50;

export class NotePickerUtils {
  static createItemsFromSelectedWikilinks():
    | DNodePropsQuickInputV2[]
    | undefined {
    const engine = ExtensionProvider.getEngine();
    const { vaults, schemas, wsRoot } = engine;

    // get selection
    const { text } = VSCodeUtils.getSelection();
    if (text === undefined) {
      return;
    }
    const wikiLinks = LinkUtils.extractWikiLinks(text as string);

    // dedupe wikilinks by value
    const uniqueWikiLinks = _.uniqBy(wikiLinks, "value");

    const activeNote =
      ExtensionProvider.getWSUtils().getActiveNote() as DNodeProps;

    // make a list of picker items from wikilinks
    const notesFromWikiLinks = LinkUtils.getNotesFromWikiLinks({
      activeNote,
      wikiLinks: uniqueWikiLinks,
      engine,
    });
    const pickerItemsFromSelection = notesFromWikiLinks.map(
      (note: DNodeProps) =>
        DNodeUtils.enhancePropForQuickInputV3({
          props: note,
          schemas,
          vaults,
          wsRoot,
        })
    );
    return pickerItemsFromSelection;
  }

  static createNoActiveItem({
    fname,
    detail,
  }: {
    fname: string;
    detail: string;
  }): DNodePropsQuickInputV2 {
    const props = DNodeUtils.create({
      id: CREATE_NEW_LABEL,
      fname,
      type: "note",
      // @ts-ignore
      vault: {},
    });
    return {
      ...props,
      label: CREATE_NEW_LABEL,
      detail,
      alwaysShow: true,
    };
  }

  static getInitialValueFromOpenEditor() {
    const initialValue = path.basename(
      VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath || "",
      ".md"
    );
    return initialValue;
  }

  static getSelection(picker: DendronQuickPickerV2): NoteQuickInput[] {
    return [...picker.selectedItems];
  }

  static fetchRootQuickPickResults = ({
    engine,
  }: {
    engine: DEngineClient;
  }) => {
    const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
    const nodes = NoteLookupUtils.fetchRootResults(engine.notes);
    return nodes.map((ent) => {
      return DNodeUtils.enhancePropForQuickInput({
        wsRoot,
        props: ent,
        schemas: engine.schemas,
        vaults,
      });
    });
  };

  /**
   * Get picker results without input from the user
   */
  static async fetchPickerResultsNoInput({
    picker,
  }: {
    picker: DendronQuickPickerV2;
  }) {
    const engine = ExtensionProvider.getDWorkspace().engine;
    const resp = await NoteLookupUtils.lookup({
      qsRaw: picker.value,
      engine,
      showDirectChildrenOnly: picker.showDirectChildrenOnly,
    });

    if (resp.length) {
      const note = resp[0];
      const isPerfectMatch = note.fname === picker.value;
      if (isPerfectMatch) {
        return [this.enhanceNoteForQuickInput({ note, engine })];
      }
    }
    return [
      NotePickerUtils.createNoActiveItem({
        fname: picker.value,
        detail: CREATE_NEW_NOTE_DETAIL,
      }),
    ];
  }

  private static enhanceNoteForQuickInput(input: {
    note: NoteProps;
    engine: DEngineClient;
  }) {
    const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
    return DNodeUtils.enhancePropForQuickInputV3({
      wsRoot,
      props: input.note,
      schemas: input.engine.schemas,
      vaults,
    });
  }

  static async fetchPickerResults(opts: {
    picker: DendronQuickPickerV2;
    transformedQuery: TransformedQueryString;
    originalQS: string;
  }) {
    const ctx = "createPickerItemsFromEngine";
    const start = process.hrtime();
    const { picker, transformedQuery, originalQS } = opts;
    const { engine, wsRoot, vaults } = ExtensionProvider.getDWorkspace();
    // if we are doing a query, reset pagination options
    PickerUtilsV2.resetPaginationOpts(picker);

    const resp = await engine.queryNotes({
      qs: transformedQuery.queryString,
      onlyDirectChildren: transformedQuery.onlyDirectChildren,
      originalQS,
    });
    let nodes = resp.data;

    if (!nodes) {
      return [];
    }

    // We need to filter our results to abide by different variations of our
    // transformed query. We should do filtering prior to doing pagination cut off.
    nodes = filterPickerResults({ itemsToFilter: nodes, transformedQuery });

    Logger.info({ ctx, msg: "post:queryNotes" });
    if (nodes.length > PAGINATE_LIMIT) {
      picker.allResults = nodes;
      picker.offset = PAGINATE_LIMIT;
      picker.moreResults = true;
      nodes = nodes.slice(0, PAGINATE_LIMIT);
    } else {
      PickerUtilsV2.resetPaginationOpts(picker);
    }
    const updatedItems = await Promise.all(
      nodes.map(async (ent) =>
        DNodeUtils.enhancePropForQuickInputV3({
          wsRoot,
          props: ent,
          schemas: engine.schemas,
          vaults,
          alwaysShow: picker.alwaysShowAll,
        })
      )
    );

    const profile = getDurationMilliseconds(start);
    Logger.info({ ctx, msg: "engine.query", profile });
    return updatedItems;
  }

  static getPickerValue(picker: DendronQuickPickerV2) {
    return [
      picker.prefix,
      picker.noteModifierValue,
      picker.selectionModifierValue,
    ]
      .filter((ent) => !_.isEmpty(ent))
      .join(".");
  }
}
