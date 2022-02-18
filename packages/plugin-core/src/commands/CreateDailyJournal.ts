import { ConfigUtils, DendronError, VaultUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { JournalNote } from "../traits/journal";
import {
  CommandOpts,
  CreateNoteWithTraitCommand,
} from "./CreateNoteWithTraitCommand";

export class CreateDailyJournalCommand extends CreateNoteWithTraitCommand {
  static requireActiveWorkspace: boolean = true;
  constructor(ext: IDendronExtension) {
    const workspaceService = ext.workspaceService;

    if (!workspaceService) {
      throw new DendronError({ message: "Workspace Service not initialized!" });
    }
    super(ext, "dendron.journal", new JournalNote(workspaceService.config));
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
