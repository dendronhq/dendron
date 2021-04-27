import { VSCodeUtils } from "../utils";
import { window, env } from "vscode";
import _ from "lodash";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = void;

export class CapitalizeTextCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.CAPITALIZE_TEXT.key;
  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }
  async execute() {
    // Get active text editor
    const textEditor = VSCodeUtils.getActiveTextEditor();
    if (_.isUndefined(textEditor)) {
      window.showErrorMessage("No active document found");
      return;
    }

    await textEditor.edit((editBuilder) => {
      textEditor.selections.forEach((selection) => {
        // Get the text of the selection
        const text = textEditor.document.getText(selection);
        const capitalizedText = text.toLocaleUpperCase(env.language);

        // Swap the old text with the capitalized text
        editBuilder.replace(selection, capitalizedText);
      });
    });
  }
}
