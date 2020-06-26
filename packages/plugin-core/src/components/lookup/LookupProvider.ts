import { DEngine, Note } from "@dendronhq/common-all";
import { ProtoEngine, engine } from "@dendronhq/engine-server";
import { QuickPick, QuickPickItem, Uri, window, workspace } from "vscode";

import { CREATE_NEW_LABEL } from "./constants";
import { DendronFileSystemProvider } from "../fsProvider";
import _ from "lodash";
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
function slashToDot(ent: string) {
  return ent.replace(/\//g, ".");
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
      L.info({ ctx: ctx + ":enter", querystring });
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
        const fnameToUri = (fname: string): Uri => {
          return Uri.parse(`denfs:/${fname.replace(/\./g, "/")}`);
        };
        const fname = selectedItem.fname;
        window.showTextDocument(fnameToUri(fname)).then(() => {
          picker.hide();
        });
        // engine
        //   .get({ username: "DUMMY" }, selectedItem.id, mode)
        //   .then(async (resp) => {
        //     // TODO: don't hardcode extension
        //     const fpath = path.join(engine.opts.root, resp.data.fname + ".md");
        //     Uri.parse(`denfs:`);
        //     const selectedFile = Uri.file(fpath);
        //     window.showTextDocument(selectedFile);
        //     this.state.lastLookupItem = selectedItem;
        //     picker.hide();
        //   });
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
