import { QuickPick, QuickPickItem, Uri, window } from "vscode";
import { node2Uri } from "./utils";

import { CREATE_NEW_LABEL } from "./constants";
import { Note } from "@dendronhq/common-all";
import _ from "lodash";
import { createLogger } from "@dendronhq/common-server";
import { engine } from "@dendronhq/engine-server";

const L = createLogger("LookupProvider");

function createNoActiveItem(): QuickPickItem {
  return {
    label: CREATE_NEW_LABEL,
    alwaysShow: true,
  };
}

function isCreateNewPick(item: QuickPickItem): boolean {
  return item.label === CREATE_NEW_LABEL;
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

  constructor() {
    this.state = {
      lastLookupItem: null,
    };
  }

  provide(picker: QuickPick<any>) {
    if (!_.isNull(this.state.lastLookupItem)) {
      picker.value = this.state.lastLookupItem.queryPath;
      picker.activeItems = [this.state.lastLookupItem];
    }

    const updatePickerItems = async () => {
      const ctx = "updatePickerItems";
      const querystring = picker.value;
      let activeItems = picker.activeItems.map((ent) => ent.label);
      let items = picker.items.map((ent) => ent.label);
      L.info({ ctx: ctx + ":enter", querystring, activeItems, items });
      const resp = await engine().query(
        { username: "dummy" },
        slashToDot(querystring),
        "note"
      );
      L.info({ ctx: ctx + ":engine:query:post" });
      picker.items = resp.data;

      // check if root query
      if (querystring === "") {
        L.info({ ctx, status: "no qs" });
        //picker.items = [engine().notes["root"]];
        picker.items = _.values(engine().notes);
        return;
      }
      // check if single item query
      if (picker.activeItems.length === 0 && querystring.length === 1) {
        // doesn't make active if single letter match
        picker.activeItems = picker.items;
        return;
      }

      // new item
      if (picker.items.length === 0) {
        // check if empty
        L.info({ ctx, status: "no active items" });
        picker.items = [createNoActiveItem()];
      }
      // DEBUG

      activeItems = picker.activeItems.map((ent) => ent.label);
      items = picker.items.map((ent) => ent.label);
      L.info({ ctx: ctx + ":exit", querystring, activeItems, items });
      return;
    };

    picker.onDidAccept(async () => {
      const ctx = "onDidAccept";
      L.info({ ctx });
      // const selectedItem = picker.selectedItems[0];
      const value = PickerUtils.getValue(picker);
      const selectedItem = PickerUtils.getSelection<Note>(picker);
      L.info({ ctx: "onDidAccept", selectedItem, value });

      let uri: Uri;
      if (isCreateNewPick(selectedItem)) {
        const fname = value;
        let nodeNew = new Note({ title: value, fname });
        await engine().write(
          { username: "DUMMY" },
          nodeNew,
          {
            newNode: true,
            parentsAsStubs: true,
          }
        );
        L.info({ ctx: `${ctx}:write:done`, value });
        uri = node2Uri(nodeNew);
        // const uri = await fnameToUri(fname, { checkIfDirectoryFile: false });
        // await (await DendronFileSystemProvider.getOrCreate()).writeFile(
        //   uri,
        //   Buffer.from("new file"),
        //   { create: true, overwrite: true }
        // );
        // throw Error("not implemented");
        //return showDocAndHidePicker(uri, picker);
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
    picker.onDidChangeValue(() => updatePickerItems());
    updatePickerItems();
  }
}
