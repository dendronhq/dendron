import { DNodeUtilsV2, NoteUtilsV2 } from "@dendronhq/common-all";
import { HistoryService } from "@dendronhq/engine-server";
import { TextEditor, Uri, window } from "vscode";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace, getWS } from "../../workspace";
import { LookupControllerV3 } from "./LookupControllerV3";
import { ILookupProviderV3 } from "./LookupProviderV3";
import { PickerUtilsV2 } from "./utils";

export class MoveNoteProvider implements ILookupProviderV3 {
  async provide(lc: LookupControllerV3) {
    const quickpick = lc.quickpick;
    if (!quickpick) {
      return;
    }
    quickpick.onDidAccept(async () => {
      const nextPicker = quickpick.nextPicker;
      if (nextPicker) {
        quickpick.vault = await nextPicker();
      }

      // setup vars
      const oldVault = PickerUtilsV2.getVaultForOpenEditor();
      const newVault = quickpick.vault ? quickpick.vault : oldVault;
      const wsRoot = DendronWorkspace.wsRoot();
      const ws = getWS();
      const engine = ws.getEngine();
      const notes = engine.notes;

      // get old note
      const editor = VSCodeUtils.getActiveTextEditor() as TextEditor;
      const oldUri: Uri = editor.document.uri;
      const oldFname = DNodeUtilsV2.fname(oldUri.fsPath);

      // get new note
      let newNote = NoteUtilsV2.getNoteByFnameV5({
        fname: quickpick.value,
        notes,
        vault: newVault,
        wsRoot,
      });
      let isStub = newNote?.stub;
      if (newNote && !isStub) {
        const errMsg = `${newVault.name}/${quickpick.value} exists`;
        window.showErrorMessage(errMsg);
        HistoryService.instance().add({
          source: "lookupProvider",
          action: "error",
        });
        return;
      }
      const data = {
        oldLoc: {
          fname: oldFname,
          vault: oldVault,
        },
        newLoc: {
          fname: quickpick.value,
          vault: newVault,
        },
      };

      // notify history service
      HistoryService.instance().add({
        source: "lookupProvider",
        action: "done",
        data,
      });
    });
  }
}
