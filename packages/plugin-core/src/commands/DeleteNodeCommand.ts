import { NotePropsV2, NoteUtilsV2, SchemaUtilsV2 } from "@dendronhq/common-all";
import { EngineDeletePayload } from "@dendronhq/common-server";
import path from "path";
import { window } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { DendronClientUtilsV2, VSCodeUtils } from "../utils";
import { DendronWorkspace, getEngine } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandOutput = EngineDeletePayload | void;

export class DeleteNodeCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.DELETE_NODE.key;
  async gatherInputs(): Promise<any> {
    return {};
  }

  async execute(): Promise<CommandOutput> {
    const editor = VSCodeUtils.getActiveTextEditor();
    const ctx = "DeleteNoteCommand";
    if (!editor) {
      window.showErrorMessage("no active text editor");
      return;
    }
    const fsPath = VSCodeUtils.getFsPathFromTextEditor(editor);
    const mode = fsPath.endsWith(".md") ? "note" : "schema";
    const trimEnd = mode === "note" ? ".md" : ".schema.yml";
    const fname = path.basename(fsPath, trimEnd);
    const client = DendronWorkspace.instance().getEngine();
    if (mode === "note") {
      const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
      const note = NoteUtilsV2.getNoteByFnameV5({
        fname,
        vault,
        notes: getEngine().notes,
        wsRoot: DendronWorkspace.wsRoot(),
      }) as NotePropsV2;
      const out = (await client.deleteNote(note.id)) as EngineDeletePayload;
      if (out.error) {
        Logger.error({ ctx, msg: "error deleting node", err: out.error });
        return;
      }
      window.showInformationMessage(`${path.basename(fsPath)} deleted`);
      return out;
    } else {
      const smod = await DendronClientUtilsV2.getSchemaModByFname({
        fname,
        client,
      });
      await client.deleteSchema(SchemaUtilsV2.getModuleRoot(smod).id);
    }
    window.showInformationMessage(`${path.basename(fsPath)} deleted`);
    return;
  }
}
