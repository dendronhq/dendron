import _ from "lodash";
import path from "path";
import { env, Uri, window } from "vscode";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = void;

export class ShowHelpCommand extends BasicCommand<CommandOpts, CommandOutput> {
  async gatherInputs(): Promise<CommandInput | undefined> {
    const resp = await window.showInputBox({
      prompt: "Select your folder for dendron",
      ignoreFocusOut: true,
      validateInput: (input: string) => {
        if (!path.isAbsolute(input)) {
          if (input[0] !== "~") {
            return "must enter absolute path";
          }
        }
        return undefined;
      },
    });
    if (_.isUndefined(resp)) {
      return;
    }
    return;
  }
  async execute() {
    env.openExternal(
      Uri.parse(
        "https://www.dendron.so/notes/e86ac3ab-dbe1-47a1-bcd7-9df0d0490b40.html"
      )
    );
  }
}
