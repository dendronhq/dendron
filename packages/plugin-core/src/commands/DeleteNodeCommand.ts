import path from "path";
import { Uri, window } from "vscode";
import { HistoryService } from "../services/HistoryService";
import { DendronClientUtilsV2, VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandOutput = void;

export class DeleteNodeCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute() {
    const editor = VSCodeUtils.getActiveTextEditor();
    if (!editor) {
      window.showErrorMessage("no active text editor");
      return;
    }
    const fsPath = VSCodeUtils.getFsPathFromTextEditor(editor);
    HistoryService.instance().add({
      source: "engine",
      action: "delete",
      uri: Uri.file(fsPath),
    });
    const mode = fsPath.endsWith(".md") ? "note" : "schema";
    const trimEnd = mode === "note" ? ".md" : "schema.yml";
    const fname = path.basename(fsPath, trimEnd);
    const client = DendronWorkspace.instance().getEngine();
    const note = await DendronClientUtilsV2.getNoteByFname({ fname, client });
    await client.deleteNote(note.id);
    window.showInformationMessage(`${path.basename(fsPath)} deleted`);
    return;
  }
}
