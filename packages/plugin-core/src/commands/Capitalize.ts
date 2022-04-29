import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandOutput = void;

export class CapitalizeCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CAPITALIZE.key;

  async execute() {
    const editor = VSCodeUtils.getActiveTextEditorOrThrow();

    // Get the selected text
    const selection = editor.selection;
    const text = editor.document.getText(selection);

    // Replace the selected text with upper case letters
    await editor.edit((editBuilder) => {
      editBuilder.replace(selection, text.toUpperCase());
    });
  }
}
