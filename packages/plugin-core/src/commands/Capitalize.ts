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

    // get the length of whitespaces at the start
    const whiteSpaces = text.length - text.trimStart().length;

    const res =
      // Add the whitespaces back to the start of the string
      " ".repeat(whiteSpaces) +
      // Change the first letter to upper case
      text.charAt(whiteSpaces).toUpperCase() +
      // Replace the first letter in the string
      text.slice(whiteSpaces + 1);

    // Replace the selected text with capitalized text
    await editor.edit((editBuilder) => {
      editBuilder.replace(selection, res);
    });
  }
}
