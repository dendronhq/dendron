import {
  DendronError,
  NoteChangeEntry,
  RenameNoteOpts,
  VaultUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { HistoryService } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import { Uri, window } from "vscode";
import {
  LookupControllerV3,
  LookupControllerV3CreateOpts,
} from "../components/lookup/LookupControllerV3";
import {
  NoteLookupProvider,
  NoteLookupProviderSuccessResp,
} from "../components/lookup/LookupProviderV3";
import {
  OldNewLocation,
  ProviderAcceptHooks,
} from "../components/lookup/utils";
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
  nonInteractive?: boolean;
  initialValue?: string;
  vaultName?: string;
  useSameVault?: boolean;
};

type CommandOutput = {
  changed: NoteChangeEntry[];
};

export class MoveNoteCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.MOVE_NOTE.key;

  async sanityCheck() {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor())) {
      return "No document open";
    }
    return;
  }

  async gatherInputs(opts?: CommandOpts): Promise<CommandInput | undefined> {
    const engine = getWS().getEngine();
    let vault = opts?.vaultName
      ? VaultUtils.getVaultByName({
          vaults: engine.vaults,
          vname: opts.vaultName,
        })
      : undefined;
    const lookupCreateOpts: LookupControllerV3CreateOpts = {
      disableVaultSelection: opts?.useSameVault,
    };
    if (vault) {
      lookupCreateOpts.buttons = [];
    }
    const lc = LookupControllerV3.create(lookupCreateOpts);
    const provider = new NoteLookupProvider("move", { allowNewNote: true });
    provider.registerOnAcceptHook(ProviderAcceptHooks.oldNewLocationHook);
    const initialValue = path.basename(
      VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath || "",
      ".md"
    );
    lc.show({
      title: "Move note",
      placeholder: "foo",
      provider,
      initialValue: opts?.initialValue || initialValue,
      nonInteractive: opts?.nonInteractive,
    });
    return new Promise((resolve) => {
      HistoryService.instance().subscribev2("lookupProvider", {
        id: "move",
        listener: async (event) => {
          if (event.action === "done") {
            HistoryService.instance().remove("move", "lookupProvider");
            const data =
              event.data as NoteLookupProviderSuccessResp<OldNewLocation>;
            if (data.cancel) {
              resolve(undefined);
            }
            const opts: CommandOpts = {
              moves: data.onAcceptHookResp,
            };
            resolve(opts);
            lc.onHide();
          } else if (event.action === "error") {
            const error = event.data.error as DendronError;
            lc.onHide();
            window.showErrorMessage(error.message);
            resolve(undefined);
          } else {
            throw new DendronError({ message: `unexpected event: ${event}` });
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

    if (ws.fileWatcher && !opts.noPauseWatcher) {
      ws.fileWatcher.pause = true;
    }
    try {
      Logger.info({ ctx, opts });
      // TODO: work for multi
      const moveOpts = opts.moves[0];
      // move notes
      const resp = await engine.renameNote(moveOpts);
      const changed = resp.data as NoteChangeEntry[];
      const vault = VaultUtils.getVaultByName({
        vaults: engine.vaults,
        vname: moveOpts.newLoc.vaultName!,
      })!;
      if (opts.closeAndOpenFile) {
        const vpath = vault2Path({ wsRoot, vault });
        const newUri = Uri.file(
          path.join(vpath, moveOpts.newLoc.fname + ".md")
        );
        await VSCodeUtils.closeCurrentFileEditor();
        await VSCodeUtils.openFileInEditor(new FileItem(newUri));
      }
      return { changed };
    } finally {
      DendronWorkspace.instance().dendronTreeView?.treeProvider.refresh();
      if (ws.fileWatcher && !opts.noPauseWatcher) {
        setTimeout(() => {
          if (ws.fileWatcher) {
            ws.fileWatcher.pause = false;
          }
          this.L.info({ ctx, msg: "exit" });
        }, 3000);
      }
    }
  }
}
