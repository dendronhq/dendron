import { QuickPick, QuickPickItem } from "vscode";

import { Note } from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import { engine } from "@dendronhq/engine-server";

const L = createLogger("LookupProvider");

function createNoActiveItem(): QuickPickItem {
  return {
    label: "Note does not exist. Create?",
    alwaysShow: true,
  };
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
    picker.onDidChangeValue(() => updatePickerItems());
    updatePickerItems();
  }
}
