import { window } from 'vscode';
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandOutput = void;

export class CapitalizeCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CAPITALIZE.key;
  async execute() {
    
    const editor = window.activeTextEditor!;

    // If there is no document open on editor, encourage user to do so and exist the command
    if (!editor) {
      window.showErrorMessage("Please open a document and select a text to capitalize");
      return;
    }

    // Get the selected text
    const text = editor.document.getText(editor.selection);

    // If there is no text select, encourage user to do so and exist the command
    if (!text) {
      window.showErrorMessage("Please select a text to capitalize");
      return;
    }

    // Replace the selected text with its capitalized version
    await editor.edit((editBuilder) => editBuilder.replace(editor.selection, text.toUpperCase()));
  }

}
