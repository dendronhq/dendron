import { QuickPick, QuickPickItem, Uri, window } from "vscode";
import { node2Uri } from "./utils";

import { CREATE_NEW_LABEL } from "./constants";
import { Note, DNode, Schema, DNodeUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { createLogger } from "@dendronhq/common-server";
import { getOrCreateEngine } from "@dendronhq/engine-server";

const L = createLogger("LookupProvider");

class QueryStringUtils {
  static getSchema(qs: string, engineResp: Note[]): Schema[] {
    const maybeSchema = engineResp[0]?.schema;
    return maybeSchema?.parent?.children as Schema[] || [];
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
}

type LookupProviderState = {
  lastLookupItem: null | Note;
};

export class LookupProvider {
  public state: LookupProviderState;
  public noActiveItem: QuickPickItem;

  constructor() {
    this.state = {
      lastLookupItem: null,
    };
    this.noActiveItem = createNoActiveItem({ label: "Create New" });
  }

  provide(picker: QuickPick<any>) {
    if (!_.isNull(this.state.lastLookupItem)) {
      picker.value = this.state.lastLookupItem.queryPath;
      picker.activeItems = [this.state.lastLookupItem];
    }

    const updatePickerItems = async () => {
      const ctx = "updatePickerItems";
      const querystring = picker.value;

      // DEBUG:BLOCK
      L.info({ ctx: ctx + ":enter", querystring });

      const resp = await getOrCreateEngine().query(
        slashToDot(querystring),
        "note"
      );
      L.info({ ctx: ctx + ":engine:query:post" });
      let updatedItems = resp.data;


      // check if root query, if so, return everything
      if (querystring === "") {
        L.info({ ctx, status: "no qs" });
        //picker.items = [engine().notes["root"]];
        picker.items = _.values(getOrCreateEngine().notes);
        return;
      }
      // check if single item query
      if (picker.activeItems.length === 0 && querystring.length === 1) {
        // doesn't make active if single letter match, return everything;
        picker.items = updatedItems;
        picker.activeItems = picker.items;
        return;
      }

      // new item
      if (updatedItems.length === 0) {
        // check if empty
        L.info({ ctx, status: "no active items" });
        this.noActiveItem.label = querystring;
        picker.items = [this.noActiveItem];
        return;
      }

      // check if we need to add schema results
      // TODO: check for note
      const schemas = QueryStringUtils.getSchema(querystring, updatedItems as Note[]);
      updatedItems = _.uniqBy(updatedItems.concat(schemas.map(schema => {
        return Note.fromSchema(DNodeUtils.dirName(querystring), schema);
      })), (ent) => {
        return ent.fname;
      });

      // check if perfect match
      if (picker.activeItems.length !== 0 && picker.activeItems[0].fname === querystring) {
        L.debug({ ctx, msg: "active = qs" });
        picker.items = updatedItems;
      }

      // check if active item is a perfect match
      if (picker.activeItems.length !== 0 && picker.activeItems[0].fname !== querystring) {
        L.debug({ ctx, msg: "active != qs" });
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
      const selectedItem = PickerUtils.getSelection<Note>(picker);
      L.info({ ctx: "onDidAccept", selectedItem, value });

      let uri: Uri;
      if (isCreateNewNotePick(selectedItem)) {
        const fname = value;
        let nodeNew: Note;
        // reuse node if a stub
        // otherwise, children will not be right
        if (selectedItem.stub) {
          nodeNew = (await getOrCreateEngine().queryOne(fname, "note")).data as Note;
        } else {
          nodeNew = new Note({ title: value, fname });
        }
        await getOrCreateEngine().write(
          nodeNew,
          {
            newNode: true,
            parentsAsStubs: true,
          }
        );
        L.info({ ctx: `${ctx}:write:done`, value });
        uri = node2Uri(nodeNew);
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
