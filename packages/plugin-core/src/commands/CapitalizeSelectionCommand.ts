import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = void;

export class CapitalizeSelectionCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.CAPITALIZE_SELECTION.key;
  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }
  async execute() {
    const maybeTextEditor = VSCodeUtils.getActiveTextEditor();

    if (maybeTextEditor) {
      if (maybeTextEditor.selection.isEmpty) {
        return;
      }

      const text = maybeTextEditor.document.getText(maybeTextEditor.selection);

      const transformedText = text
        .split(" ")
        .map((token) => `${token[0].toLocaleUpperCase()}${token.slice(1)}`)
        .join(" ");

      await maybeTextEditor.edit((editBuilder) => {
        editBuilder.replace(maybeTextEditor.selection, transformedText);
      });
    }
  }
}
