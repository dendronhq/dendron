import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { BasicCommand } from "./base";
import { CommandOutput as NoteLookupOutput } from "./NoteLookupCommand";
import { AutoCompletableRegistrar } from "../utils/registers/AutoCompletableRegistrar";

type CommandOpts = {};

type CommandOutput = {
  lookup: Promise<NoteLookupOutput | undefined>;
};

export class CreateNoteCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CREATE_NOTE.key;

  async execute(opts: CommandOpts) {
    const ctx = "CreateNoteCommand";

    Logger.info({ ctx, msg: "enter", opts });

    return {
      lookup: AutoCompletableRegistrar.getNoteLookupCmd().run(),
    };
  }
}
