import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = void;

export class ShowInfo extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.SHOW_INFO.key;
  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }
  async execute() {
    console.log("new command being executed");
    // env.openExternal(
    //   Uri.parse(
    //     "https://www.dendron.so/notes/f9540bb6-7a5a-46db-ae7c-e1a606f28c73.html"
    //   )
    // );
  }
}
