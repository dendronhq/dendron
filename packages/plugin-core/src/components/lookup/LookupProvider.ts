import { QuickPick, QuickPickItem, TaskScope, window } from "vscode";

import { CREATE_NEW_LABEL } from "./constants";
import { Note } from "@dendronhq/common-all";
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

class PickerUtils {
  static getValue(picker: QuickPick<any>) {
    return picker.value;
  }
}

export class LookupProvider {
  provide(picker: QuickPick<any>) {
    const updatePickerItems = async () => {
      const ctx = "updatePickerItems";
      const querystring = picker.value;
      L.info({ ctx: ctx + ":enter", querystring });
      const resp = await engine().query(
        { username: "dummy" },
        querystring,
        "note"
      );
      const notesData = resp.data as Note[];
      L.info({ ctx: ctx + ":engine:query:post" });
      //const pickerItems = notesData.map((ent) => ({ label: ent.title }));
      picker.items = resp.data;

      // check if root query
      if (querystring === "") {
        L.info({ ctx, status: "no qs" });
        picker.items = [engine().notes["root"]];
      } else if (picker.activeItems.length === 0 && querystring.length === 1) {
        // doesn't make active if single letter match
        picker.activeItems = picker.items;
      } else if (picker.activeItems.length === 0) {
        // check if empty
        L.info({ ctx, status: "no active items" });
        picker.items = [createNoActiveItem()];
      }
      L.info({ ctx: ctx + ":exit", querystring });
    };

    picker.onDidAccept(() => {
      const ctx = "onDidAccept";
      L.info({ ctx });
      const selectedItem = picker.selectedItems[0];
      L.info({ ctx: "onDidAccept", selectedItem });
      if (isCreateNewPick(selectedItem)) {
        const value = PickerUtils.getValue(picker);
        window.showInformationMessage(`create new ${value}`);
        const fname = value;
        engine()
          .write({ username: "DUMMY" }, new Note({ title: value, fname }), {
            newNode: true,
          })
          .then((resp) => {
            L.info({ ctx: `${ctx}:write:done`, value });
          });
      } else {
        window.showInformationMessage("open existing");
      }
    });
    picker.onDidChangeSelection((inputs: QuickPickItem[]) => {
      const ctx = "onDidChangeSelection";
      L.info({ ctx, inputs });
    });
    picker.onDidChangeValue(() => updatePickerItems());
    updatePickerItems();
  }
}
