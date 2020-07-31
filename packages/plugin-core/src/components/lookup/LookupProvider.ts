import {
  DEngine,
  DNode,
  DNodeUtils,
  Note,
  Schema,
  SchemaUtils
} from "@dendronhq/common-all";
import { DendronEngine } from "@dendronhq/engine-server";
import _ from "lodash";
import { QuickPick, QuickPickItem, Uri, window } from "vscode";
import { Logger } from "../../logger";
import { HistoryService } from "../../services/HistoryService";
import { getDurationMilliseconds, profile } from "../../utils/system";
import { CREATE_NEW_LABEL } from "./constants";
import { node2Uri } from "./utils";

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

function createNoActiveItem(opts?: { label?: string }): QuickPickItem {
  const cleanOpts = _.defaults(opts, { label: "" });
  return {
    label: cleanOpts.label,
    detail: CREATE_NEW_LABEL,
    alwaysShow: true,
  };
}

function isCreateNewNotePick(node: Note | undefined): boolean {
  if (!node) {
    return true;
  }
  return node.detail === CREATE_NEW_LABEL || node.stub || node.schemaStub;
}

function slashToDot(ent: string) {
  return ent.replace(/\//g, ".");
}

function showDocAndHidePicker(uri: Uri, picker: QuickPick<any>): any {
  const start = process.hrtime();
  const ctx = { ctx: uri, value: picker.value };
  return window.showTextDocument(uri).then(
    () => {
      let profile = getDurationMilliseconds(start);
      Logger.info({ ...ctx, msg: "showTextDocument", profile });
      picker.hide();
      profile = getDurationMilliseconds(start);
      Logger.info({ ...ctx, msg: "picker.hide", profile });
      return;
    },
    (err) => {
      Logger.error({ ...ctx, err, msg: "exit", profile });
      throw err;
    }
  );
}

class PickerUtils {
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
    } else {
      // handle schemas that are at current level
      const schemas = SchemaUtils.matchNote(
        QueryStringUtils.goUp(qs),
        engine.schemas,
        {
          matchNamespace: false,
        }
      ).children as Schema[];
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

type EngineFlavor = "note"|"schema"
type EngineOpts = {
  flavor: EngineFlavor
}

function addSchemaResults(notes: Note[], engine: DEngine) {
  return notes.map((note) => {
    const schema = SchemaUtils.matchNote(note as Note, engine.schemas);
    (note as Note).schema = schema;
    return note;
  });
}

function showRootResults(flavor: EngineFlavor, engine: DEngine) {
  if (flavor === "note") {
    return _.uniqBy(
      _.map(_.values(engine.notes), (ent) => ent.domain),
      "domain"
    );
  } else {
    return _.uniqBy(
      _.map(_.values(engine.schemas), (ent) => ent.domain),
      "domain"
    );
  }
}

export class LookupProvider {
  public noActiveItem: QuickPickItem;

  constructor() {
    this.noActiveItem = createNoActiveItem({ label: "Create New" });
  }

  async onDidAccept(picker: QuickPick<DNode>, opts: EngineOpts) {
    const start = process.hrtime();
    const value = PickerUtils.getValue(picker);
    let profile;
    const ctx2 = {
      ctx: "onDidAccept",
      value,
      opts
    };
    L.info({ ...ctx2, msg: "enter" });
    // @ts-ignore
    const selectedItem = PickerUtils.getSelection<Note>(picker);

    let uri: Uri;
    if (isCreateNewNotePick(selectedItem)) {
      L.info({ ...ctx2, msg: "createNewPick" });
      const fname = value;
      let nodeNew: DNode;
      // reuse node if a stub
      // otherwise, children will not be right
      if (selectedItem.stub) {
        L.info({ ...ctx2, msg: "createNewPick:stub" });
        nodeNew = (
          await DendronEngine.getOrCreateEngine().queryOne(fname, "note")
        ).data as Note;
        nodeNew.stub = false;
        profile = getDurationMilliseconds(start);
        L.info({
          ...ctx2,
          msg: "createNewPick:stub",
          func: "engine.queryOne",
          profile,
        });
      } else if (selectedItem.schemaStub) {
        L.info({ ...ctx2, msg: "createNewPick:schemaStub" });
        nodeNew = new Note({
          fname: selectedItem.fname,
        });
        profile = getDurationMilliseconds(start);
        L.info({
          ...ctx2,
          msg: "createNewPick:schemaStub",
          func: "Note.new",
          profile,
        });
      } else {
        nodeNew = opts.flavor === "note" ? new Note({fname}) : new Schema({fname})
      }

      // FIXME: this should be done after the node is created
      uri = node2Uri(nodeNew);
      const historyService = HistoryService.instance();
      historyService.add({ source: "engine", action: "create", uri });
      profile = getDurationMilliseconds(start);
      L.info({ ...ctx2, msg: "historyService.add", profile });

      await DendronEngine.getOrCreateEngine().write(nodeNew, {
        newNode: true,
        parentsAsStubs: true,
      });
      profile = getDurationMilliseconds(start);
      L.info({ ...ctx2, msg: "engine.write", profile });
    } else {
      uri = node2Uri(selectedItem);
    }
    profile = getDurationMilliseconds(start);
    L.info({ ...ctx2, msg: "exit", profile });
    return showDocAndHidePicker(uri, picker);
  }

  async onUpdatePickerItem(picker: QuickPick<DNode>, opts: EngineOpts) {
    const start = process.hrtime();
    picker.busy = true;
    const querystring = picker.value;
    let profile: number;
    const ctx2 = {
      ctx: "updatePickerItems",
      querystring,
      opts,
    };
    const engine = DendronEngine.getOrCreateEngine();
    try {
      L.info({ ...ctx2, msg: "enter" });
      const resp = await engine.query(
        slashToDot(querystring),
        opts.flavor
      );
      profile = getDurationMilliseconds(start);
      L.info({ ...ctx2, msg: "engine.query", profile });
      // let nodes = opts.flavor === "note" ? engine.notes : engine.schemas;

      let updatedItems = resp.data;
      // enrich notes with schemas
      if (opts.flavor === "note") {
        updatedItems = addSchemaResults(updatedItems as Note[], engine);
        profile = getDurationMilliseconds(start);
        L.info({ ...ctx2, msg: "matchSchema", profile });
      }

      // check if root query, if so, return everything
      if (querystring === "") {
        L.info({ ...ctx2, msg: "no qs" });
        picker.items = showRootResults(opts.flavor, engine);
        return;
      }
      // check if single item query, vscode doesn't surface single letter queries
      if (picker.activeItems.length === 0 && querystring.length === 1) {
        picker.items = updatedItems;
        picker.activeItems = picker.items;
        return;
      }

      const perfectMatch = _.find(updatedItems, { fname: querystring });
      // NOTE: we modify this later so need to track this here
      const noUpdatedItems = updatedItems.length === 0;
      const queryEndsWithDot = querystring.endsWith(".");

      // check if we just entered a new level, only want to match children schema
      if (opts.flavor === "note") {
      updatedItems = PickerUtils.genSchemaSuggestions({
        items: updatedItems as Note[],
        qs: querystring,
        engine: engine,
      });
      profile = getDurationMilliseconds(start);
      L.info({ ...ctx2, msg: "genSchemaSuggestions", profile });
    }
      // updatedItems = PickerUtils.filterStubs(updatedItems as Note[]);

      // check if new item, return if that's the case
      if (
        noUpdatedItems ||
        (picker.activeItems.length === 0 && !perfectMatch)
      ) {
        L.info({ ...ctx2, msg: "no matches" });
        // @ts-ignore
        picker.items = updatedItems.concat([this.noActiveItem]);
        return;
      }

      // check if perfect match, remove @noActiveItem result if that's the case
      if (perfectMatch) {
        L.debug({ ...ctx2, msg: "active = qs" });
        picker.activeItems = [perfectMatch];
        picker.items = updatedItems;
      } else if (queryEndsWithDot) {
        // don't show noActiveItem for dot queries
        L.debug({ ...ctx2, msg: "active != qs, end with ." });
        picker.items = updatedItems;
      } else {
        // regular result
        L.debug({ ...ctx2, msg: "active != qs" });
        // @ts-ignore
        picker.items = [this.noActiveItem].concat(updatedItems);
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
    }
  }

  provide(picker: QuickPick<DNode>) {

    const opts = {
      flavor: "schema" as const
    }

    picker.onDidAccept(async () => {
      this.onDidAccept(picker, opts);
    });
    // picker.onDidChangeSelection((inputs: QuickPickItem[]) => {
    //   const ctx = "onDidChangeSelection";
    // });
    picker.onDidChangeValue(() => {
      this.onUpdatePickerItem(picker, opts);
    });
    this.onUpdatePickerItem(picker, opts);
  }
}
