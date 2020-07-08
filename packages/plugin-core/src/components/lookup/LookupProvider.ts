import { DNodeUtils, Note, Schema, SchemaUtils, DNode } from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import { DendronEngine  } from "@dendronhq/engine-server";
import _ from "lodash";
import { QuickPick, QuickPickItem, Uri, window } from "vscode";
import { CREATE_NEW_LABEL } from "./constants";
import { node2Uri } from "./utils";
import { HistoryService } from "../../services/HistoryService";


const L = createLogger("LookupProvider");

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
    out.push(maybeSchema?.children as Schema[])
    return _.flatten(_.filter(out, ent => !_.isUndefined(ent)));
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

function showDocAndHidePicker(uri: Uri, picker: QuickPick<any>) {
  window.showTextDocument(uri).then(
    () => {
      picker.hide();
    },
    (err) => {
      L.error({ err });
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

  static filterStubs(items: DNode[]): DNode[] {
    return _.filter(items, ent => {
      return !ent.stub
    });
  }
}


export class LookupProvider {
  public noActiveItem: QuickPickItem;

  constructor() {
    this.noActiveItem = createNoActiveItem({ label: "Create New" });
  }

  provide(picker: QuickPick<DNode>) {
    const engine = DendronEngine.getOrCreateEngine();

    const updatePickerItems = async () => {
      const ctx = "updatePickerItems";
      const querystring = picker.value;

      // DEBUG:BLOCK
      L.info({ ctx: ctx + ":enter", querystring });

      const resp = await DendronEngine.getOrCreateEngine().query(
        slashToDot(querystring),
        "note"
      );
      L.info({ ctx: ctx + ":engine:query:post" });
      // enrich notes with schemas
      let updatedItems = resp.data.map((note => {
        const schema = SchemaUtils.matchNote(note as Note, engine.schemas);
        (note as Note).schema = schema;
        return note;
      }));


      // check if root query, if so, return everything
      if (querystring === "") {
        L.info({ ctx, status: "no qs" });
        //picker.items = [engine().notes["root"]];
        picker.items = _.uniq(_.map(_.values(engine.notes), ent => ent.domain));
        return;
      }
      // check if single item query, vscode doesn't surface single letter queries 
      if (picker.activeItems.length === 0 && querystring.length === 1) {
        picker.items = updatedItems;
        picker.activeItems = picker.items;
        return;
      }

      const perfectMatch = _.find(updatedItems, {fname: querystring});
      // NOTE: we modify this later so need to track this here
      const noUpdatedItems = updatedItems.length === 0;

      if (querystring.endsWith(".")) {
        // show schema suggestions
        const schemas = SchemaUtils.matchNote(querystring, engine.schemas, {matchNamespace: false}).children as Schema[];
        //const schemas = QueryStringUtils.getAllSchemaAtLevel(querystring, updatedItems as Note[]);
        updatedItems = _.uniqBy(updatedItems.concat(schemas.map(schema => {
          return Note.fromSchema(DNodeUtils.dirName(querystring), schema);
        })), (ent) => {
          return ent.fname;
        });
      }
      updatedItems = PickerUtils.filterStubs(updatedItems);

      // check if new item
      if (noUpdatedItems || (picker.activeItems.length === 0 && !perfectMatch)) {
        L.info({ ctx, status: "no matches" });
        // @ts-ignore
        picker.items = updatedItems.concat([this.noActiveItem]);
        return;
      }

      // check if perfect match, remove @noActiveItem result if that's the case
      if (perfectMatch) {
        L.debug({ ctx, msg: "active = qs" });
        picker.activeItems = [perfectMatch];
        picker.items = updatedItems;
      } else {
        // regular result
        L.debug({ ctx, msg: "active != qs" });
        // @ts-ignore
        picker.items = [this.noActiveItem].concat(updatedItems);
      }

      // DEBUG
      // activeItems = picker.activeItems.map((ent) => ent.label);
      // items = picker.items.map((ent) => ent.label);
      L.info({ ctx: ctx + ":exit", querystring });
      return;
    };

    picker.onDidAccept(async () => {
      const ctx = "onDidAccept";
      L.info({ ctx });
      const value = PickerUtils.getValue(picker);
      // @ts-ignore
      const selectedItem = PickerUtils.getSelection<Note>(picker);
      L.info({ ctx: "onDidAccept", selectedItem, value });

      let uri: Uri;
      if (isCreateNewNotePick(selectedItem)) {
        const fname = value;
        let nodeNew: Note;
        // reuse node if a stub
        // otherwise, children will not be right
        if (selectedItem.stub) {
          nodeNew = (await DendronEngine.getOrCreateEngine().queryOne(fname, "note")).data as Note;
        } else if (selectedItem.schemaStub) {
          nodeNew = new Note({ title: selectedItem.fname, fname: selectedItem.fname });
        } else {
          nodeNew = new Note({ title: value, fname });
        }

        // FIXME: this should be done after the node is created
        uri = node2Uri(nodeNew);
        const historyService = HistoryService.instance();
        historyService.add({source: "engine", action: "create", uri});

        await DendronEngine.getOrCreateEngine().write(
          nodeNew,
          {
            newNode: true,
            parentsAsStubs: true,
          }
        );
        L.info({ ctx: `${ctx}:write:done`, value });
      } else {
        uri = node2Uri(selectedItem);
      }
      L.info({ ctx: "onDidAccept:showTextDocument:pre", uri });
      return showDocAndHidePicker(uri, picker);
    });
    picker.onDidChangeSelection((inputs: QuickPickItem[]) => {
      const ctx = "onDidChangeSelection";
      L.info({ ctx, inputs });
    });
    picker.onDidChangeValue(updatePickerItems);
    updatePickerItems();
  }
}
