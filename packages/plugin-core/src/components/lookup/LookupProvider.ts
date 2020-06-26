import { DEngine, Note } from "@dendronhq/common-all";
import { FileType, QuickPick, QuickPickItem, Uri, window } from "vscode";
import { ProtoEngine, engine } from "@dendronhq/engine-server";

import { CREATE_NEW_LABEL } from "./constants";
import { DendronFileSystemProvider } from "../fsProvider";
import _ from "lodash";
import { createLogger } from "@dendronhq/common-server";

const L = createLogger("LookupProvider");

function createNoActiveItem(): QuickPickItem {
  return {
    label: CREATE_NEW_LABEL,
    alwaysShow: true,
  };
}

const fnameToUri = async (
  fname: string,
  opts?: { checkIfDirectoryFile?: boolean }
): Promise<Uri> => {
  opts = _.defaults(opts, { checkIfDirectoryFile: true });
  let uri = Uri.parse(`denfs:/${fname.replace(/\./g, "/")}`);
  if (opts.checkIfDirectoryFile) {
    const fs = await DendronFileSystemProvider.getOrCreate();
    if (fs.stat(uri).type === FileType.Directory) {
      uri = await fnameToUri(fname + ".index");
    }
  }
  return uri;
};

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
        return;
      }
      // check if single item query
      if (picker.activeItems.length === 0 && querystring.length === 1) {
        // doesn't make active if single letter match
        picker.activeItems = picker.items;
        return;
      }

      // new item
      if (picker.activeItems.length === 0) {
        // check if empty
        L.info({ ctx, status: "no active items" });
        picker.items = [createNoActiveItem()];
      }
      L.info({ ctx: ctx + ":exit", querystring });
      return;
    };

    picker.onDidAccept(async () => {
      const ctx = "onDidAccept";
      L.info({ ctx });
      // const selectedItem = picker.selectedItems[0];
      const selectedItem = PickerUtils.getSelection<Note>(picker);
      L.info({ ctx: "onDidAccept", selectedItem });

      if (isCreateNewPick(selectedItem)) {
        const value = PickerUtils.getValue(picker);
        window.showInformationMessage(`create new ${value}`);
        const fname = value;
        await engine().write(
          { username: "DUMMY" },
          new Note({ title: value, fname }),
          {
            newNode: true,
          }
        );
        L.info({ ctx: `${ctx}:write:done`, value });
        const uri = await fnameToUri(fname, { checkIfDirectoryFile: false });
        await (await DendronFileSystemProvider.getOrCreate()).writeFile(
          uri,
          Buffer.from("new file"),
          { create: true, overwrite: true }
        );
        return showDocAndHidePicker(uri, picker);
      }

      let uri: Uri;
      if (PickerUtils.getValue(picker) === "") {
        uri = await fnameToUri("/index");
      } else {
        // default
        const fname = selectedItem.fname;
        uri = await fnameToUri(fname);
      }
      L.info({ ctx: "onDidAccept:showTextDocument:pre", uri });

      window.showTextDocument(uri).then(
        () => {
          picker.hide();
        },
        (err) => {
          L.error({ ctx, err });
          throw err;
        }
      );
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
    });
    picker.onDidChangeSelection((inputs: QuickPickItem[]) => {
      const ctx = "onDidChangeSelection";
      L.info({ ctx, inputs });
    });
    picker.onDidChangeValue(() => updatePickerItems());
    updatePickerItems();
  }
}
