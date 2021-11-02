import { DENDRON_COMMANDS } from "../constants";
import { JournalNote } from "../noteTypes/Journal";
import { CreateTypedNoteCommand } from "./CreateTypedNoteCommand";

export class CreateDailyJournalCommand extends CreateTypedNoteCommand {
  constructor() {
    super("dendron.journal", new JournalNote());

    // override the key to maintain compatibility
    this.key = DENDRON_COMMANDS.CREATE_DAILY_JOURNAL_NOTE.key;
  }
}
