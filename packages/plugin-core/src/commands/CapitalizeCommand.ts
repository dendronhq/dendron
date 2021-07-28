import { window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = void;

export class CapitalizeCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CAPITALIZE.key;
  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }
  async execute() {
    const editor = window.activeTextEditor;

		if (editor) {
			const document = editor.document;
			const selection = editor.selection;

			// Get the word within the selection
			const word = document.getText(selection);
			const capatalized = word.toUpperCase();
			editor.edit(editBuilder => {
				editBuilder.replace(selection, capatalized);
			});
			window.showInformationMessage("Capitalize command used.");
		} 
  }
}
