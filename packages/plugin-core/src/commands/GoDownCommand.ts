import path from "path";
import { DendronQuickPickerV2 } from "../components/lookup/types";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { BasicCommand } from "./base";
import { LookupCommand } from "./LookupCommand";

type CommandOpts = {};

type CommandOutput = DendronQuickPickerV2;

export class GoDownCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.GO_DOWN_HIERARCHY.key;
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

    const picker = (await new LookupCommand().execute({
      flavor: "note",
      value,
    })) as DendronQuickPickerV2;
    return picker;
  }
}
