import { DENDRON_COMMANDS } from "../../constants";
import { AutoCompletableRegistrar } from "../../utils/registers/AutoCompletableRegistrar";
import { BasicCommand } from "../base";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = void;

export class NoteLookupAutoCompleteCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.LOOKUP_NOTE_AUTO_COMPLETE.key;

  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }

  async execute() {
    AutoCompletableRegistrar.fire();
  }
}
