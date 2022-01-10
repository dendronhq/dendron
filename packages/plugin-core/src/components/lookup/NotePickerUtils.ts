/* eslint-disable no-dupe-class-members */
import {
  DendronError,
  DEngineClient,
  DNodeProps,
  DNodePropsQuickInputV2,
  DNodeUtils,
  NoteLookupUtils,
  NoteProps,
  NoteQuickInput,
  SchemaUtils,
} from "@dendronhq/common-all";
import { DLogger, getDurationMilliseconds } from "@dendronhq/common-server";
import { HistoryService, LinkUtils } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import { ExtensionProvider } from "../../ExtensionProvider";
import { Logger } from "../../logger";
import { VSCodeUtils } from "../../vsCodeUtils";
import { getDWorkspace } from "../../workspace";
import { WSUtils } from "../../WSUtils";
import { CREATE_NEW_DETAIL, CREATE_NEW_LABEL } from "./constants";
import { ILookupControllerV3 } from "./LookupControllerV3Interface";
import { NoteLookupProviderChangeStateResp } from "./LookupProviderV3Interface";
import { DendronQuickPickerV2, TransformedQueryString } from "./types";
import { filterPickerResults, PickerUtilsV2 } from "./utils";

const PAGINATE_LIMIT = 50;

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

    const activeNote = WSUtils.getActiveNote() as DNodeProps;

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
  }: {
    fname: string;
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
      detail: CREATE_NEW_DETAIL,
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
    const { wsRoot, vaults } = getDWorkspace();
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
    const engine = getDWorkspace().engine;
    const resp = await NoteLookupUtils.lookup({
      qs: picker.value,
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
    return [NotePickerUtils.createNoActiveItem({ fname: picker.value })];
  }

  private static enhanceNoteForQuickInput(input: {
    note: NoteProps;
    engine: DEngineClient;
  }) {
    const { wsRoot, vaults } = getDWorkspace();
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
    const { engine, wsRoot, vaults } = getDWorkspace();
    // if we are doing a query, reset pagination options
    PickerUtilsV2.resetPaginationOpts(picker);

    const resp = await engine.queryNotes({
      qs: transformedQuery.queryString,
      onlyDirectChildren: transformedQuery.onlyDirectChildren,
      originalQS,
    });
    let nodes: NoteProps[] = resp.data;

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

export class SchemaPickerUtils {
  static async fetchPickerResultsWithCurrentValue({
    picker,
  }: {
    picker: DendronQuickPickerV2;
  }) {
    const { engine, wsRoot, vaults } = getDWorkspace();
    const resp = await engine.querySchema(picker.value);
    const node = SchemaUtils.getModuleRoot(resp.data[0]);
    const perfectMatch = node.fname === picker.value;
    return !perfectMatch
      ? [NotePickerUtils.createNoActiveItem({ fname: picker.value })]
      : [
          DNodeUtils.enhancePropForQuickInputV3({
            wsRoot,
            props: node,
            schemas: engine.schemas,
            vaults,
          }),
        ];
  }

  static async fetchPickerResults(opts: {
    picker: DendronQuickPickerV2;
    qs: string;
  }) {
    const ctx = "SchemaPickerUtils:fetchPickerResults";
    const start = process.hrtime();
    const { picker, qs } = opts;
    const { engine, wsRoot, vaults } = getDWorkspace();
    const resp = await engine.querySchema(qs);
    let nodes = resp.data.map((ent) => SchemaUtils.getModuleRoot(ent));

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
    Logger.info({ ctx, msg: "engine.querySchema", profile });
    return updatedItems;
  }
}

export class NoteLookupProviderUtils {
  static cleanup(opts: { id: string; controller: ILookupControllerV3 }) {
    const { id, controller } = opts;
    controller.onHide();
    HistoryService.instance().remove(id, "lookupProvider");
  }

  static subscribe(opts: {
    id: string;
    controller: ILookupControllerV3;
    logger: DLogger;
    onDone?: Function;
    onError?: Function;
    onChangeState?: Function;
    onHide?: Function;
  }): Promise<any | undefined> {
    const { id, controller, logger, onDone, onError, onChangeState, onHide } =
      opts;

    return new Promise((resolve) => {
      HistoryService.instance().subscribev2("lookupProvider", {
        id,
        listener: async (event) => {
          if (event.action === "done") {
            if (onDone) {
              const out = await onDone(event);
              NoteLookupProviderUtils.cleanup({ id, controller });
              resolve(out);
            } else {
              resolve(event);
            }
          } else if (event.action === "error") {
            if (onError) {
              const out = await onError(event);
              resolve(out);
            } else {
              const error = event.data.error as DendronError;
              logger.error({ error });
              resolve(undefined);
            }
          } else if (event.action === "changeState") {
            if (onChangeState) {
              const out = await onChangeState(event);
              resolve(out);
            } else {
              const data = event.data as NoteLookupProviderChangeStateResp;
              if (data.action === "hide") {
                if (onHide) {
                  const out = await onHide(event);
                  resolve(out);
                } else {
                  logger.info({
                    ctx: id,
                    msg: "changeState.hide event received.",
                  });
                  resolve(undefined);
                }
              } else {
                logger.error({
                  ctx: id,
                  msg: "invalid changeState action received.",
                });
                resolve(undefined);
              }
            }
          } else {
            logger.error({
              ctx: id,
              msg: `unexpected event: ${event.action}`,
              event,
            });
            resolve(undefined);
          }
        },
      });
    });
  }
}
