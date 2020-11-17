import { env, Uri } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = void;

export class ContributeCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.CONTRIBUTE.key;
  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }
  async execute() {
    env.openExternal(
      Uri.parse("https://accounts.dendron.so/account/subscribe")
    );
  }
}
