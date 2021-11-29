import { DENDRON_COMMANDS } from "../constants";
import { JournalNote } from "../traits/Journal";
import { CreateNoteWithTraitCommand } from "./CreateNoteWithTraitCommand";

export class CreateDailyJournalCommand extends CreateNoteWithTraitCommand {
  constructor() {
    super("dendron.journal", new JournalNote());

    // override the key to maintain compatibility
    this.key = DENDRON_COMMANDS.CREATE_DAILY_JOURNAL_NOTE.key;
  }
}
