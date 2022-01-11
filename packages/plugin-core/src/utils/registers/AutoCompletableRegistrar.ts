import { AutoCompletable } from "../AutoCompletable";
import { DendronError, ErrorFactory } from "@dendronhq/common-all";
import { CodeCommandInstance } from "../../commands/base";
import { DENDRON_COMMANDS } from "../../constants";
import { NoteLookupCommand } from "../../commands/NoteLookupCommand";

/**
 * Populated during initialization with commands that implement function: cmd.onAutoComplete
 * */
export class AutoCompletableRegistrar {
  static _UI_AUTOCOMPLETE_COMMANDS = new Map<
    string,
    CodeCommandInstance & AutoCompletable
  >();

  static register = (
    key: string,
    cmd: CodeCommandInstance & AutoCompletable
  ) => {
    this._UI_AUTOCOMPLETE_COMMANDS.set(key, cmd);
  };

  static getNoteLookupCmd(): NoteLookupCommand {
    const isNoteLookup = (cmd: any): cmd is NoteLookupCommand => {
      return (cmd as NoteLookupCommand).run !== undefined;
    };

    const noteLookupCmd = this.getCmd(DENDRON_COMMANDS.LOOKUP_NOTE.key);

    if (isNoteLookup(noteLookupCmd)) {
      return noteLookupCmd;
    } else {
      throw new DendronError({ message: `Could not get note lookup command.` });
    }
  }

  /** Retrieve command instance that is used by UI. */
  static getCmd = (key: string): CodeCommandInstance & AutoCompletable => {
    const cmd = this._UI_AUTOCOMPLETE_COMMANDS.get(key);

    if (cmd === undefined) {
      throw ErrorFactory.createInvalidStateError({
        message: `AutoCompletable command is not registered for '${key}'`,
      });
    }

    return cmd;
  };
}
