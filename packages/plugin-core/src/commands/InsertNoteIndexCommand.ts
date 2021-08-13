import { Logger } from "../logger";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandOutput = {};

export class InsertNoteIndexCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.INSERT_NOTE_INDEX.key;

  async execute(opts: CommandOpts) {
    const ctx = "InsertNoteLinkCommand";
    Logger.info({ ctx, msg: "execute", opts });
    return {};
  }
}
