import {
  DendronError,
  DNodeUtils,
  NoteChangeEntry,
  NoteUtils,
  RenameNoteOpts,
  VaultUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { HistoryService } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import { TextEditor, Uri, window } from "vscode";
import { VaultSelectButton } from "../components/lookup/buttons";
import { LookupControllerV3 } from "../components/lookup/LookupControllerV3";
import { NoteLookupProvider } from "../components/lookup/LookupProviderV3";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { FileItem } from "../external/fileutils/FileItem";
import { Logger } from "../logger";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace, getWS } from "../workspace";
import { BasicCommand } from "./base";

type CommandInput = any;

type CommandOpts = {
  moves: RenameNoteOpts[];
  /**
   * Show notification message
   */
  silent?: boolean;
  /**
   * Close and open current file
   */
  closeAndOpenFile?: boolean;
  /**
   * Pause all watchers
   */
  noPauseWatcher?: boolean;
};

type CommandOutput = {
  changed: NoteChangeEntry[];
};

export class MoveNoteCommand extends BasicCommand<CommandOpts, CommandOutput> {
  static key = DENDRON_COMMANDS.MOVE_NOTE.key;

  async sanityCheck() {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor())) {
      return "No document open";
    }
    return;
  }

  createLookup() {
    const vaults = getWS().config.vaults;
    const isMultiVault = vaults.length > 1;
    const buttons = [VaultSelectButton.create(isMultiVault)];
    const lc = new LookupControllerV3({ nodeType: "note", buttons });
    return lc;
  }

  async gatherInputs(): Promise<CommandInput | undefined> {
    const lc = this.createLookup();
    const provider = new NoteLookupProvider("move", { allowNewNote: true });
    provider.registerOnAcceptHook(async ({ quickpick, selectedItems }) => {
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
      const oldFname = DNodeUtils.fname(oldUri.fsPath);

      const fname = selectedItems[0].fname;
      // get new note
      let newNote = NoteUtils.getNoteByFnameV5({
        fname,
        notes,
        vault: newVault,
        wsRoot,
      });
      let isStub = newNote?.stub;
      if (newNote && !isStub) {
        const vaultName = VaultUtils.getName(newVault);
        const errMsg = `${vaultName}/${quickpick.value} exists`;
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
      return data;
    });
    const initialValue = path.basename(
      VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath || "",
      ".md"
    );
    lc.show({
      title: "Move note",
      placeholder: "foo",
      provider,
      initialValue,
    });
    return new Promise((resolve) => {
      HistoryService.instance().subscribev2("lookupProvider", {
        id: "move",
        listener: async (event) => {
          if (event.action === "done") {
            HistoryService.instance().remove("move", "lookupProvider");
            resolve({ moves: event.data.onAcceptHookResp });
            lc.onHide();
          } else if (event.action === "error") {
            return;
          } else {
            throw new DendronError({ msg: `unexpected event: ${event}` });
          }
        },
      });
    });
  }

  async execute(opts: CommandOpts) {
    const ctx = "MoveNoteCommand";
    opts = _.defaults(opts, { closeAndOpenFile: true });
    const ws = getWS();
    const wsRoot = DendronWorkspace.wsRoot();
    const engine = ws.getEngine();

    if (ws.vaultWatcher && !opts.noPauseWatcher) {
      ws.vaultWatcher.pause = true;
    }
    try {
      Logger.info({ ctx, opts });
      // TODO: work for multi
      const moveOpts = opts.moves[0];
      // move notes
      const resp = await engine.renameNote(moveOpts);
      const changed = resp.data as NoteChangeEntry[];
      if (opts.closeAndOpenFile) {
        const vpath = vault2Path({ wsRoot, vault: moveOpts.newLoc.vault! });
        const newUri = Uri.file(
          path.join(vpath, moveOpts.newLoc.fname + ".md")
        );
        await VSCodeUtils.closeCurrentFileEditor();
        await VSCodeUtils.openFileInEditor(new FileItem(newUri));
      }
      return { changed };
    } finally {
      DendronWorkspace.instance().dendronTreeView?.treeProvider.refresh();
      if (ws.vaultWatcher && !opts.noPauseWatcher) {
        setTimeout(() => {
          if (ws.vaultWatcher) {
            ws.vaultWatcher.pause = false;
          }
          this.L.info({ ctx, msg: "exit" });
        }, 3000);
      }
    }
  }
}
