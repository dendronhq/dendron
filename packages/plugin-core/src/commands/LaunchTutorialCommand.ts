import { DENDRON_COMMANDS } from "../constants";
import { getWS } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = void;

export class LaunchTutorialCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.LAUNCH_TUTORIAL.key;

  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }

  async execute(_opts: CommandOpts): Promise<CommandOutput> {
    const ws = getWS();

    return await ws.showWelcome();
  }
}
