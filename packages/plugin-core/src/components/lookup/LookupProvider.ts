import { DEngine, Note } from "@dendronhq/common-all";
import { ProtoEngine, engine } from "@dendronhq/engine-server";
import { QuickPick, QuickPickItem, Uri, window, workspace } from "vscode";

import { CREATE_NEW_LABEL } from "./constants";
import { createLogger } from "@dendronhq/common-server";
import path from "path";

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

export class LookupProvider {
  public lastLookupValue: string;

  constructor() {
    this.lastLookupValue = "";
  }
  provide(picker: QuickPick<any>) {
    picker.value = this.lastLookupValue;

    const updatePickerItems = async () => {
      const ctx = "updatePickerItems";
      const querystring = picker.value;
      L.info({ ctx: ctx + ":enter", querystring });
      const resp = await engine().query(
        { username: "dummy" },
        querystring,
        "note"
      );
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
      // const selectedItem = picker.selectedItems[0];
      const selectedItem = PickerUtils.getSelection<Note>(picker);
      L.info({ ctx: "onDidAccept", selectedItem });
      if (isCreateNewPick(selectedItem)) {
        const value = PickerUtils.getValue(picker);
        window.showInformationMessage(`create new ${value}`);
        const fname = value;
        engine()
          .write({ username: "DUMMY" }, new Note({ title: value, fname }), {
            newNode: true,
          })
          .then(() => {
            L.info({ ctx: `${ctx}:write:done`, value });
          });
      } else {
        const engine: DEngine = ProtoEngine.getEngine();
        const mode = "note";
        engine
          .get({ username: "DUMMY" }, selectedItem.id, mode)
          .then(async (resp) => {
            // TODO: don't hardcode extension
            const fpath = path.join(engine.opts.root, resp.data.fname + ".md");
            const selectedFile = Uri.file(fpath);
            const document = await workspace.openTextDocument(selectedFile);
            window.showTextDocument(document);
            this.lastLookupValue = resp.data.fname;
            picker.hide();
          });
        // window.showInformationMessage(`open existing ${absPath}`);
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
