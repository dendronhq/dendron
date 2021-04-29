import {
  DendronError,
  DNodeUtils,
  NoteChangeEntry,
  VaultUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { HistoryService } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import { TextEditor, Uri, window } from "vscode";
import { LookupControllerV3 } from "../components/lookup/LookupControllerV3";
import { NoteLookupProvider } from "../components/lookup/LookupProviderV3";
import {
  OldNewLocation,
  PickerUtilsV2,
  ProviderAcceptHooks,
} from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { FileItem } from "../external/fileutils/FileItem";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BaseCommand } from "./base";

type CommandInput = {
  move: OldNewLocation[];
};

type CommandOpts = {
  files: { oldUri: Uri; newUri: Uri }[];
  silent: boolean;
  closeCurrentFile: boolean;
  openNewFile: boolean;
  noModifyWatcher?: boolean;
};
type CommandOutput = {
  changed: NoteChangeEntry[];
};

export { CommandOutput as RenameNoteOutputV2a };

export class RenameNoteV2aCommand extends BaseCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.RENAME_NOTE.key;
  public silent?: boolean;

  async gatherInputs(): Promise<CommandInput | undefined> {
    const lc = LookupControllerV3.create();
    const provider = new NoteLookupProvider("rename", { allowNewNote: true });
    provider.registerOnAcceptHook(ProviderAcceptHooks.oldNewLocationHook);

    const initialValue = path.basename(
      VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath || "",
      ".md"
    );
    lc.show({
      title: "Rename note",
      placeholder: "foo",
      provider,
      initialValue,
    });
    return new Promise((resolve) => {
      HistoryService.instance().subscribev2("lookupProvider", {
        id: "rename",
        listener: async (event) => {
          if (event.action === "done") {
            HistoryService.instance().remove("rename", "lookupProvider");
            resolve({ move: event.data.onAcceptHookResp });
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

  async enrichInputs(inputs: CommandInput): Promise<CommandOpts> {
    const editor = VSCodeUtils.getActiveTextEditor() as TextEditor;
    const oldUri: Uri = editor.document.uri;
    const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
    const move = inputs.move[0];
    const fname = move.newLoc.fname;
    const vpath = vault2Path({ vault, wsRoot: DendronWorkspace.wsRoot() });
    const newUri = Uri.file(path.join(vpath, fname + ".md"));
    return {
      files: [{ oldUri, newUri }],
      silent: false,
      closeCurrentFile: true,
      openNewFile: true,
    };
  }

  async sanityCheck() {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor())) {
      return "No document open";
    }
    return;
  }

  async showResponse(res: CommandOutput) {
    const { changed } = res;
    if (changed.length > 0 && !this.silent) {
      window.showInformationMessage(`Dendron updated ${changed.length} files`);
    }
  }

  async execute(opts: CommandOpts) {
    const ctx = "RenameNoteV2a";
    this.L.info({ ctx, msg: "enter", opts });
    const ws = DendronWorkspace.instance();
    try {
      const { files } = opts;
      const { newUri, oldUri } = files[0];
      if (ws.vaultWatcher && !opts.noModifyWatcher) {
        ws.vaultWatcher.pause = true;
      }
      const engine = ws.getEngine();
      const oldFname = DNodeUtils.fname(oldUri.fsPath);
      const vault = VaultUtils.getVaultByNotePathV4({
        fsPath: oldUri.fsPath,
        wsRoot: DendronWorkspace.wsRoot(),
        vaults: engine.vaultsv3,
      });

      const resp = await engine.renameNote({
        oldLoc: {
          fname: oldFname,
          vault,
        },
        newLoc: {
          fname: DNodeUtils.fname(newUri.fsPath),
          vault,
        },
      });
      const changed = resp.data as NoteChangeEntry[];

      // re-link
      if (!this.silent) {
        if (opts.closeCurrentFile) {
          await VSCodeUtils.closeCurrentFileEditor();
        }
        opts.openNewFile &&
          (await VSCodeUtils.openFileInEditor(new FileItem(files[0].newUri)));
      }
      return {
        changed,
      };
    } finally {
      if (ws.vaultWatcher && !opts.noModifyWatcher) {
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
