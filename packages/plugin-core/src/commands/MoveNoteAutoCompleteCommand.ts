import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import { AutoCompletableRegistrar } from "../utils/registers/AutoCompletableRegistrar";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = void;

export class MoveNoteAutoCompleteCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.MOVE_NOTE_AUTO_COMPLETE.key;

  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }

  async execute() {
    await AutoCompletableRegistrar.getCmd(
      DENDRON_COMMANDS.MOVE_NOTE.key
    ).onAutoComplete();
  }
}
