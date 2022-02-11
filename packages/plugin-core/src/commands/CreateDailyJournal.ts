import { ConfigUtils, VaultUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { JournalNote } from "../traits/journal";
import {
  CommandOpts,
  CreateNoteWithTraitCommand,
} from "./CreateNoteWithTraitCommand";

export class CreateDailyJournalCommand extends CreateNoteWithTraitCommand {
  constructor(ext: IDendronExtension) {
    super(
      ext,
      "dendron.journal",
      new JournalNote(ext.workspaceService!.config)
    );
    ext.getWorkspaceConfig();
    // override the key to maintain compatibility
    this.key = DENDRON_COMMANDS.CREATE_DAILY_JOURNAL_NOTE.key;
  }

  override execute(opts: CommandOpts): Promise<void> {
    const config = this._extension.getDWorkspace().config;
    const journalConfig = ConfigUtils.getJournal(config);

    if (_.isUndefined(journalConfig.dailyVault)) {
      return super.execute({ ...opts });
    } else {
      const dailyVault = journalConfig.dailyVault;
      const vault = dailyVault
        ? VaultUtils.getVaultByName({
            vaults: this._extension.getEngine().vaults,
            vname: dailyVault,
          })
        : undefined;

      return super.execute({ ...opts, vaultOverride: vault });
    }
  }
}
