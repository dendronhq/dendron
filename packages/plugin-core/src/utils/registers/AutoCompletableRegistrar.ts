import { AutoCompletable } from "../AutoCompletable";
import { ErrorFactory } from "@dendronhq/common-all";

/**
 * Populated during initialization with commands that implement function: cmd.onAutoComplete
 * */
export class AutoCompletableRegistrar {
  static _UI_AUTOCOMPLETE_COMMANDS = new Map<string, AutoCompletable>();

  static register = (key: string, cmd: AutoCompletable) => {
    this._UI_AUTOCOMPLETE_COMMANDS.set(key, cmd);
  };

  /** Retrieve command instance that is used by UI. */
  static getCmd = (key: string): AutoCompletable => {
    const cmd = this._UI_AUTOCOMPLETE_COMMANDS.get(key);

    if (cmd === undefined) {
      throw ErrorFactory.createInvalidStateError({
        message: `AutoCompletable command is not registered for '${key}'`,
      });
    }

    return cmd;
  };
}
