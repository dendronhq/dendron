import { SchemaUtilsV2 } from "@dendronhq/common-all";
import { EngineDeletePayload } from "@dendronhq/common-server";
import path from "path";
import { Uri, window } from "vscode";
import { HistoryService } from "../services/HistoryService";
import { DendronClientUtilsV2, VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandOutput = EngineDeletePayload | void;

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
    const trimEnd = mode === "note" ? ".md" : ".schema.yml";
    const fname = path.basename(fsPath, trimEnd);
    const client = DendronWorkspace.instance().getEngine();
    if (mode === "note") {
      const note = await DendronClientUtilsV2.getNoteByFname({ fname, client });
      return await client.deleteNote(note.id);
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
