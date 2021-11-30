import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import {
  AUTO_COMPLETABLE_COMMAND_ID,
  UIAutoCompletableCmds,
} from "../utils/autoCompleter";

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
    await UIAutoCompletableCmds.getCmd(
      AUTO_COMPLETABLE_COMMAND_ID.NOTE_LOOKUP
    ).onAutoComplete();
  }
}
