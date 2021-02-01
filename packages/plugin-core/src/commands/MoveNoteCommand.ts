import {
  DendronError,
  NoteChangeEntry,
  RenameNoteOptsV2,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { HistoryService } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import { Uri } from "vscode";
import { VaultSelectButton } from "../components/lookup/buttons";
import { LookupControllerV3 } from "../components/lookup/LookupControllerV3";
import { MoveNoteProvider } from "../components/lookup/MoveNoteProvider";
import { DENDRON_COMMANDS } from "../constants";
import { FileItem } from "../external/fileutils/FileItem";
import { Logger } from "../logger";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace, getWS } from "../workspace";
import { BasicCommand } from "./base";

type CommandInput = any;

type CommandOpts = RenameNoteOptsV2 & {
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
    const buttons = [VaultSelectButton.create(true)];
    const lc = new LookupControllerV3({ nodeType: "note", buttons });
    return lc;
  }

  async gatherInputs(): Promise<CommandInput | undefined> {
    const lc = this.createLookup();
    const provider = new MoveNoteProvider();
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
            resolve(event.data);
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
      // move notes
      const resp = await engine.renameNote(opts);
      const changed = resp.data as NoteChangeEntry[];
      if (opts.closeAndOpenFile) {
        const vpath = vault2Path({ wsRoot, vault: opts.newLoc.vault! });
        const newUri = Uri.file(path.join(vpath, opts.newLoc.fname + ".md"));
        await VSCodeUtils.closeCurrentFileEditor();
        await VSCodeUtils.openFileInEditor(new FileItem(newUri));
      }
      return { changed };
    } finally {
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
