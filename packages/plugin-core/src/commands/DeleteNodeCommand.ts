import {
  DVault,
  EngineDeletePayload,
  NoteProps,
  NoteUtils,
  SchemaUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import path from "path";
import { TextEditor, window } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { DendronClientUtilsV2, VSCodeUtils } from "../utils";
import { getEngine, getExtension, getDWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {
  _fsPath?: string;
};

type CommandOutput = EngineDeletePayload | void;

function formatDeletedMsg({
  fsPath,
  vault,
}: {
  fsPath: string;
  vault: DVault;
}) {
  return `${path.basename(fsPath)} (${VaultUtils.getName(vault)}) deleted`;
}

export class DeleteNodeCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.DELETE_NODE.key;
  async gatherInputs(): Promise<any> {
    return {};
  }

  async execute(opts?: CommandOpts): Promise<CommandOutput> {
    const editor = VSCodeUtils.getActiveTextEditor() as TextEditor;
    const ctx = "DeleteNoteCommand";
    if ((opts && opts._fsPath) || editor) {
      const fsPath =
        opts && opts._fsPath
          ? opts._fsPath
          : VSCodeUtils.getFsPathFromTextEditor(editor);
      const mode = fsPath.endsWith(".md") ? "note" : "schema";
      const trimEnd = mode === "note" ? ".md" : ".schema.yml";
      const fname = path.basename(fsPath, trimEnd);
      const client = getExtension().getEngine();
      if (mode === "note") {
        const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
        const note = NoteUtils.getNoteByFnameV5({
          fname,
          vault,
          notes: getEngine().notes,
          wsRoot: getDWorkspace().wsRoot,
        }) as NoteProps;
        const out = (await client.deleteNote(note.id)) as EngineDeletePayload;
        if (out.error) {
          Logger.error({ ctx, msg: "error deleting node", error: out.error });
          return;
        }
        window.showInformationMessage(
          formatDeletedMsg({ fsPath, vault: note.vault })
        );
        return out;
      } else {
        const smod = await DendronClientUtilsV2.getSchemaModByFname({
          fname,
          client,
        });
        await client.deleteSchema(SchemaUtils.getModuleRoot(smod).id);
        window.showInformationMessage(
          formatDeletedMsg({ fsPath, vault: smod.vault })
        );
        return;
      }
    } else {
      window.showErrorMessage("no active text editor");
      return;
    }
  }
}
