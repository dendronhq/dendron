import path from "path";
// import { DendronQuickPickerV2 } from "../components/lookup/types";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { BasicCommand } from "./base";
import {
  NoteLookupCommand,
  CommandOutput as NoteLookupCommandOut,
} from "./NoteLookupCommand";

type CommandOpts = {
  noConfirm?: boolean;
};

type CommandOutput = NoteLookupCommandOut;

export class GoDownCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.GO_DOWN_HIERARCHY.key;
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute(opts: CommandOpts) {
    const maybeTextEditor = VSCodeUtils.getActiveTextEditor();
    let value = "";
    if (maybeTextEditor) {
      value = path.basename(maybeTextEditor.document.uri.fsPath, ".md") + ".";
      if (value === "root.") {
        value = "";
      }
    }

    const out = await new NoteLookupCommand().run({
      initialValue: value,
      noConfirm: opts.noConfirm,
      noQSTransform: true,
    });
    return out!;
  }
}
