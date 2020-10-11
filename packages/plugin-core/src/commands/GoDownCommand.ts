import path from "path";
import { LookupController } from "../components/lookup/LookupController";
import { DendronQuickPickerV2 } from "../components/lookup/LookupProvider";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";
import { LookupCommand } from "./LookupCommand";

type CommandOpts = {};

type CommandOutput = LookupController | DendronQuickPickerV2;

export class GoDownCommand extends BasicCommand<CommandOpts, CommandOutput> {
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute() {
    const maybeTextEditor = VSCodeUtils.getActiveTextEditor();
    let value = "";
    if (maybeTextEditor) {
      value = path.basename(maybeTextEditor.document.uri.fsPath, ".md") + ".";
      if (value === "root.") {
        value = "";
      }
    }

    if (DendronWorkspace.lsp()) {
      const picker = (await new LookupCommand().execute({
        flavor: "note",
        value,
      })) as DendronQuickPickerV2;
      return picker;
    }
    const ws = DendronWorkspace.instance();
    const controller = new LookupController(ws, { flavor: "note" });

    controller.show({ value });
    return controller;
  }
}
