import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import { UI_NOTE_LOOKUP_COMMAND } from "./NoteLookupCommand";

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
  static num: number = 0;
  async execute() {
    await UI_NOTE_LOOKUP_COMMAND.onAutoComplete();
  }
}
