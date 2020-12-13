import { env, Uri } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = void;

export class ShowHelpCommand extends BasicCommand<CommandOpts, CommandOutput> {
  static key = DENDRON_COMMANDS.SHOW_HELP.key;
  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }
  async execute() {
    env.openExternal(
      Uri.parse(
        "https://www.dendron.so/notes/f9540bb6-7a5a-46db-ae7c-e1a606f28c73.html"
      )
    );
  }
}
