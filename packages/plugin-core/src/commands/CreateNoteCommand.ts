import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { InputArgCommand } from "./base";
import {
  CommandOutput as NoteLookupOutput,
  CommandRunOpts as NoteLookupRunOpts,
} from "./NoteLookupCommand";
import { AutoCompletableRegistrar } from "../utils/registers/AutoCompletableRegistrar";
import _ from "lodash";

type CommandOpts = any;

type CommandOutput = {
  lookup: Promise<NoteLookupOutput | undefined>;
};
export class CreateNoteCommand extends InputArgCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CREATE_NOTE.key;

  private isNotePropsArgs(opts: CommandOpts) {
    return !_.isEmpty(opts) && opts.id;
  }

  async execute(opts: CommandOpts) {
    const ctx = "CreateNoteCommand";

    Logger.info({ ctx, msg: "enter", opts });
    const args: NoteLookupRunOpts = {};
    if (this.isNotePropsArgs(opts)) {
      args.initialValue = opts.fname;
    }
    return {
      lookup: AutoCompletableRegistrar.getNoteLookupCmd().run(args),
    };
  }
}
