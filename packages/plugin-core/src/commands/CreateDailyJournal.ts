import { NoteUtils } from "@dendronhq/common-all";
import { cleanName } from "@dendronhq/common-server";
import { DENDRON_COMMANDS } from "../constants";
import { DendronClientUtilsV2 } from "../utils";
import { getWS } from "../workspace";
import { BaseCommand } from "./base";
import { GotoNoteCommand } from "./GotoNote";

type CommandOpts = {
  fname: string;
};

type CommandInput = {
  title: string;
};

export class CreateDailyJournalCommand extends BaseCommand<
  CommandOpts,
  any,
  CommandInput
> {
  static key = DENDRON_COMMANDS.CREATE_DAILY_JOURNAL_NOTE.key;
  async gatherInputs(): Promise<CommandInput | undefined> {
    const dailyJournalDomain = getWS().config.journal.dailyDomain;
    let fname: string;
    fname = DendronClientUtilsV2.genNoteName("JOURNAL", {
      overrides: { domain: dailyJournalDomain },
    });
    return { title: fname };
  }

  async enrichInputs(inputs: CommandInput) {
    let { title } = inputs;
    return {
      title,
      fname: `${cleanName(title)}`,
    };
  }

  async execute(opts: CommandOpts) {
    const { fname } = opts;
    const ctx = "CreateDailyJournal";
    const journalName = getWS().config.journal.name;
    this.L.info({ ctx, journalName, fname });
    const title = NoteUtils.genJournalNoteTitle({
      fname,
      journalName,
    });
    await new GotoNoteCommand().execute({
      qs: fname,
      overrides: { title },
    });
  }
}
