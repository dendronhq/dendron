import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = void;

/**
 * Command to be used for development purposes only.
 *
 * Main use case: place some piece of code to test its behavior and be able
 * to easily trigger to run that piece of code.
 * */
export class DevTriggerCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.DEV_TRIGGER.key;

  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }

  async execute() {
    // Place to add some temporary piece of code for development.
    // Please remember to remove the added code prior to pushing.
  }
}
