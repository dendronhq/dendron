import _ from "lodash";
import path from "path";
import { env, Uri, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = void;

export class ShowHelpCommand extends BasicCommand<CommandOpts, CommandOutput> {
  static key = DENDRON_COMMANDS.SHOW_HELP.key;
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
        "https://www.dendron.so/notes/f9540bb6-7a5a-46db-ae7c-e1a606f28c73.html"
      )
    );
  }
}
