import { DendronError, ERROR_STATUS } from "@dendronhq/common-all";
import _ from "lodash";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { isAnythingSelected } from "../utils/editor";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandOutput = { error?: DendronError; captialized?: string };

export class CapitalizeCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CAPITALIZE.key;
  async execute() {
    const ctx = DENDRON_COMMANDS.CAPITALIZE;
    this.L.info({ ctx });
    if (!isAnythingSelected()) {
      const error = DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: `nothing selected`,
      });
      this.L.error({ error });
      return { error };
    }
    const { text, editor, selection } = VSCodeUtils.getSelection();
    console.log({ text, editor, selection })
    if (_.isUndefined(text)) {
      const error = DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: `nothing selected`,
      });
      this.L.error({ error });
      return { error };
    }
    const capitalized = text.toLocaleUpperCase();
    return { capitalized };
  }
}
