import { ConfigUtils, VaultUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { DENDRON_COMMANDS } from "../constants";
import { JournalNote } from "../traits/Journal";
import { getDWorkspace } from "../workspace";
import {
  CommandOpts,
  CreateNoteWithTraitCommand,
} from "./CreateNoteWithTraitCommand";

export class CreateDailyJournalCommand extends CreateNoteWithTraitCommand {
  constructor() {
    super("dendron.journal", new JournalNote());

    // override the key to maintain compatibility
    this.key = DENDRON_COMMANDS.CREATE_DAILY_JOURNAL_NOTE.key;
  }

  override execute(opts: CommandOpts): Promise<void> {
    const config = getDWorkspace().config;
    const journalConfig = ConfigUtils.getJournal(config);

    const { engine } = getDWorkspace();

    if (_.isUndefined(journalConfig.dailyVault)) {
      return super.execute({ ...opts });
    } else {
      const dailyVault = journalConfig.dailyVault;
      const vault = dailyVault
        ? VaultUtils.getVaultByName({
            vaults: engine.vaults,
            vname: dailyVault,
          })
        : undefined;

      return super.execute({ ...opts, vaultOverride: vault });
    }
  }
}
