import {
  DEngine,
  DNode,
  DNodePropsV2,
  DNodeUtils,
  Note,
  NotePropsV2,
  Schema,
  SchemaUtils,
} from "@dendronhq/common-all";
import { DendronEngine } from "@dendronhq/engine-server";
import _ from "lodash";
import { QuickPick, QuickPickItem, Uri, window, WorkspaceFolder } from "vscode";
import { Logger } from "../../logger";
import { HistoryService } from "../../services/HistoryService";
import { getDurationMilliseconds } from "../../utils/system";
import { DendronWorkspace } from "../../workspace";
import { CREATE_NEW_DETAIL } from "./constants";
import { createNoActiveItem, node2Uri, showDocAndHidePicker } from "./utils";

export type DendronQuickPicker = QuickPick<DNode & { label: string }> & {
  justActivated?: boolean;
  prev?: { activeItems: any; items: any };
  onCreate?: (note: Note) => Promise<void>;
};

export type DendronQuickPickerV2 = QuickPick<
  DNodePropsV2 & { label: string }
> & {
  justActivated?: boolean;
  prev?: { activeItems: any; items: any };
  onCreate?: (note: NotePropsV2) => Promise<void>;
};

const L = Logger;
// @ts-ignore
class QueryStringUtils {
  /**
   * Get all schema matches for current query
   *
   * # eg. Query with Root
   *
   * schema:
   * - bar
   *  - alpha
   *  - beta
   * - foo
   *   - one
   *   - two
   * qs: foo
   *
   * return: [one, two]
   *
   * # eg. Query not at root
   * qs: foo.one
   *
   *
   * @param _qs
   * @param engineResp
   */
  static getAllSchemaAtLevel(_qs: string, engineResp: Note[]): Schema[] {
    const maybeSchema = engineResp[0]?.schema;
    let out: Schema[][] = [];
    // if (!this.isDomainQuery(_qs)) {
    //   out.push(maybeSchema?.parent?.children as Schema[])
    // }
    out.push(maybeSchema?.children as Schema[]);
    return _.flatten(_.filter(out, (ent) => !_.isUndefined(ent)));
  }

  /**
   *  Go up one level for the hiearchy
   * @param qs
   */
  static goUp(qs: string) {
    return qs.split(".").slice(0, -1).join(".");
  }

  static isDomainQuery(qs: string): boolean {
    return _.isEmpty(DNodeUtils.dirName(qs));
  }
}

function isCreateNewNotePick(node: Note | undefined): boolean {
  if (!node) {
    return true;
  }
  return node.detail === CREATE_NEW_DETAIL || node.stub || node.schemaStub;
}

function slashToDot(ent: string) {
  return ent.replace(/\//g, ".");
}

export class PickerUtils {
  static getValue<T extends QuickPickItem = QuickPickItem>(
    picker: QuickPick<T>
  ) {
    return picker.value;
  }

  static getSelection<T extends QuickPickItem = QuickPickItem>(
    picker: QuickPick<T>
  ): T {
    return picker.selectedItems[0];
  }

  static genSchemaSuggestions({
    items,
    qs,
    engine,
  }: {
    items: Note[];
    qs: string;
    engine: DEngine;
  }): Note[] {
    const queryEndsWithDot = qs.endsWith(".");

    // handle schemas that are child of current
    if (queryEndsWithDot) {
      const schemas = SchemaUtils.matchNote(qs, engine.schemas, {
        matchNamespace: false,
      }).children as Schema[];
      items = _.uniqBy(
        items.concat(
          schemas.map((schema) => {
            return Note.fromSchema(DNodeUtils.dirName(qs), schema);
          })
        ),
        (ent) => {
          return ent.fname;
        }
      );
    }
    return items;
  }

  static filterStubs(items: Note[]): Note[] {
    return _.filter(items, (ent) => {
      if (ent.schemaStub) {
        return true;
      }
      return !ent.stub;
    });
  }
}

export type EngineFlavor = "note" | "schema";
export type EngineOpts = {
  flavor: EngineFlavor;
};

export class LookupProvider {
  public noActiveItem: QuickPickItem;
  public opts: EngineOpts;

  constructor(opts: EngineOpts) {
    this.noActiveItem = createNoActiveItem();
    this.opts = opts;
  }

  validate(value: string, flavor: EngineFlavor): string | undefined {
    if (flavor === "schema") {
      if (value.split(".").length > 1) {
        return "schemas can only be one level deep";
      }
    }
    return;
  }

  showRootResults(flavor: EngineFlavor, engine: DEngine) {
    if (flavor === "note") {
      return _.uniqBy(
        _.map(_.values(engine.notes), (ent) => ent.domain),
        "domain.id"
      );
    } else {
      return _.uniqBy(
        _.map(_.values(engine.schemas), (ent) => ent.domain),
        "domain.id"
      );
    }
  }

  async onDidAccept(picker: DendronQuickPicker, opts: EngineOpts) {
    const start = process.hrtime();
    const value = PickerUtils.getValue(picker);
    let profile;
    const ctx2 = {
      ctx: "onDidAccept",
      value,
      opts,
    };
    L.info({ ...ctx2, msg: "enter" });
    // @ts-ignore
    const selectedItem = PickerUtils.getSelection<Note>(picker);

    const resp = this.validate(picker.value, opts.flavor);
    if (resp) {
      window.showErrorMessage(resp);
      return;
    }

    let uri: Uri;
    const wsFolders = DendronWorkspace.workspaceFolders() as WorkspaceFolder[];
    const engine = DendronWorkspace.instance().engine as DEngine;

    if (isCreateNewNotePick(selectedItem)) {
      L.info({ ...ctx2, msg: "createNewPick", selectedItem });
      const fname = value;
      let nodeNew: DNode;
      let foundStub = false;
      // reuse node if a stub
      // otherwise, children will not be right
      if (_.isUndefined(selectedItem)) {
        L.info({ ...ctx2, msg: "create new note" });
        nodeNew =
          opts.flavor === "note" ? new Note({ fname }) : new Schema({ fname });
      } else if (selectedItem.stub) {
        L.info({ ...ctx2, msg: "createNewPick:stub" });
        // get note
        nodeNew = engine.notes[selectedItem.id];
        nodeNew.stub = false;
        foundStub = true;
        profile = getDurationMilliseconds(start);
        L.info({
          ...ctx2,
          msg: "createNewPick:stub",
          profile,
        });
      } else if (selectedItem.schemaStub) {
        L.info({ ...ctx2, msg: "createNewPick:schemaStub" });
        nodeNew = selectedItem;
        profile = getDurationMilliseconds(start);
        L.info({
          ...ctx2,
          msg: "createNewPick:schemaStub",
          func: "Note.new",
          profile,
        });
      } else {
        L.info({ ...ctx2, msg: "create from label" });
        nodeNew =
          opts.flavor === "note" ? new Note({ fname }) : new Schema({ fname });
      }

      // apply schema template
      if (opts.flavor === "note") {
        // TODO
        SchemaUtils.matchAndApplyTemplate({ note: nodeNew as Note, engine });
        const maybeSchema = SchemaUtils.matchNote(
          nodeNew as Note,
          engine.schemas
        );
        if (maybeSchema) {
          (nodeNew as Note).schema = maybeSchema;
        }
        // schema stub counts as stub
        nodeNew.stub = false;
        (nodeNew as Note).schemaStub = false;
      }

      // FIXME: this should be done after the node is created
      uri = node2Uri(nodeNew, wsFolders);
      const historyService = HistoryService.instance();
      historyService.add({ source: "engine", action: "create", uri });
      profile = getDurationMilliseconds(start);
      L.info({ ...ctx2, msg: "historyService.add", profile });
      const noteExists = DNodeUtils.getNoteByFname(nodeNew.fname, engine);
      // sanity check
      if (noteExists && !foundStub && !selectedItem.schemaStub) {
        L.error({ ...ctx2, msg: "action will overwrite existing note" });
        return;
      }
      if (opts.flavor === "note") {
        if (picker.onCreate) {
          await picker.onCreate(nodeNew as Note);
        }
      }

      // need to apply schema to new notes
      await engine.write(nodeNew, {
        newNode: true,
        parentsAsStubs: true,
      });
      profile = getDurationMilliseconds(start);
      L.info({ ...ctx2, msg: "engine.write", profile });
    } else {
      uri = node2Uri(selectedItem, wsFolders);
    }
    profile = getDurationMilliseconds(start);
    L.info({ ...ctx2, msg: "exit", profile });
    return showDocAndHidePicker(uri, picker);
  }

  async onUpdatePickerItem(picker: DendronQuickPicker, opts: EngineOpts) {
    const start = process.hrtime();
    picker.busy = true;

    const filterNoActiveItem = (items: DNode[]): DNode[] => {
      return _.reject(items, { label: this.noActiveItem.label });
    };

    let pickerValue = picker.value;
    // @ts-ignore
    if (picker.justActivated) {
      const lastDotIndex = pickerValue.lastIndexOf(".");
      if (lastDotIndex < 0) {
        pickerValue = "";
      } else {
        pickerValue = pickerValue.slice(0, lastDotIndex + 1);
      }
    }
    const querystring = slashToDot(pickerValue);
    const queryOrig = slashToDot(picker.value);
    const ws = DendronWorkspace.instance();
    let profile: number;
    const ctx2 = {
      ctx: "updatePickerItems",
      querystring,
      opts,
    };
    const queryEndsWithDot = queryOrig.endsWith(".");
    const engine = ws.engine;
    try {
      // check if root query, special case, return everything
      if (querystring === "") {
        L.info({ ...ctx2, msg: "no qs" });
        picker.items = this.showRootResults(
          opts.flavor,
          engine as DendronEngine
        );
        return;
      }

      const items: DNode[] = [...picker.items];
      let updatedItems = filterNoActiveItem(items);
      updatedItems = [this.noActiveItem as DNode].concat(updatedItems);
      L.info({ ...ctx2, msg: "enter" });

      // first query still
      if (
        queryEndsWithDot ||
        queryOrig.split(".").length < 2 ||
        // @ts-ignore
        picker.justActivated
      ) {
        const resp = await engine.query(querystring, opts.flavor);
        const notes = resp.data;
        // @ts-ignore
        updatedItems = [this.noActiveItem as DNode].concat(
          // @ts-ignore
          notes.map((ent) => new Note(ent))
        );
        profile = getDurationMilliseconds(start);
        L.info({ ...ctx2, msg: "engine.query", profile });
      }

      // check if single item query, vscode doesn't surface single letter queries
      if (picker.activeItems.length === 0 && querystring.length === 1) {
        picker.items = updatedItems;
        picker.activeItems = picker.items;
        return;
      }

      // don't use query string since this can change
      const perfectMatch = _.find(updatedItems, { fname: queryOrig });
      // NOTE: we modify this later so need to track this here
      const noUpdatedItems = updatedItems.length === 0;

      // check if we just entered a new level, only want to match children schema
      if (opts.flavor === "note") {
        updatedItems = PickerUtils.genSchemaSuggestions({
          items: updatedItems as Note[],
          qs: querystring,
          engine: engine as DEngine,
        });
        profile = getDurationMilliseconds(start);
        L.info({ ...ctx2, msg: "genSchemaSuggestions", profile });
      }

      // check if new item, return if that's the case
      if (
        noUpdatedItems ||
        (picker.activeItems.length === 0 && !perfectMatch && !queryEndsWithDot)
      ) {
        L.info({ ...ctx2, msg: "no matches" });
        // @ts-ignore
        picker.items = updatedItems; //.concat([this.noActiveItem]);
        return;
      }

      // check if perfect match, remove @noActiveItem result if that's the case
      if (perfectMatch) {
        L.debug({ ...ctx2, msg: "active = qs" });
        picker.activeItems = [perfectMatch];
        picker.items = filterNoActiveItem(updatedItems);
      } else if (queryEndsWithDot) {
        // don't show noActiveItem for dot queries
        L.debug({ ...ctx2, msg: "active != qs, end with ." });
        picker.items = filterNoActiveItem(updatedItems);
      } else {
        // regular result
        L.debug({ ...ctx2, msg: "active != qs" });
        // @ts-ignore
        picker.items = updatedItems;
      }

      // DEBUG
      // activeItems = picker.activeItems.map((ent) => ent.label);
      // items = picker.items.map((ent) => ent.label);
      L.info({ ...ctx2, msg: "exit" });
      return;
    } finally {
      profile = getDurationMilliseconds(start);
      L.info({ ...ctx2, msg: "exit", querystring, profile });
      picker.busy = false;
      // @ts-ignore
      picker.justActivated = false;
    }
  }

  provide(picker: DendronQuickPicker) {
    const { opts } = this;
    picker.onDidAccept(async () => {
      this.onDidAccept(picker, opts);
    });
    picker.onDidChangeValue(() => {
      this.onUpdatePickerItem(picker, opts);
    });
    // OPTIMIZE: might not be needed anymore
    this.onUpdatePickerItem(picker, opts);
  }
}
