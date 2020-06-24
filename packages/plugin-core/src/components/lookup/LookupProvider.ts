import { QuickPick, QuickPickItem } from "vscode";

import { Note } from "@dendron/common-all";
import { createLogger } from "@dendron/common-server";
import { engine } from "@dendron/engine-server";

const L = createLogger("LookupProvider");

export class LookupProvider {
  provide(picker: QuickPick<any>) {
    const updatePickerItems = async (): Promise<QuickPickItem[]> => {
      const querystring = picker.value;
      L.info({ ctx: "updatePickerItems", querystring });
      const resp = await engine().query(
        { username: "dummy" },
        querystring,
        "note"
      );
      const notesData = resp.data as Note[];
      L.info({ ctx: "updatePickerItems:engine:query:post", notesData });
      return notesData.map((ent) => ({ label: ent.title }));
    };
    picker.onDidChangeValue(() => updatePickerItems());
    updatePickerItems();
  }
}
