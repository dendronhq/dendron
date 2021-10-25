import { ConfigUtils, VaultUtils } from "@dendronhq/common-all";
import { cleanName } from "@dendronhq/common-server";
import _ from "lodash";
import * as vscode from "vscode";
import { DendronClientUtilsV2 } from "../clientUtils";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { JournalNote } from "../noteTypes/journal";
import { getDWorkspace } from "../workspace";
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
  key = DENDRON_COMMANDS.CREATE_DAILY_JOURNAL_NOTE.key;
  async gatherInputs(): Promise<CommandInput | undefined> {
    const journalType: JournalNote = new JournalNote();

    const name: string = journalType.onWillCreate.setNameModifier({});
    return { title: name };
  }

  async enrichInputs(inputs: CommandInput) {
    const { title } = inputs;
    return {
      title,
      fname: `${cleanName(title)}`,
    };
  }

  async execute(opts: CommandOpts) {
    const { fname } = opts;
    const ctx = "CreateDailyJournal";
    const config = getDWorkspace().config;
    const journalConfig = ConfigUtils.getJournal(config);
    const journalName = journalConfig.name;
    const journalType: JournalNote = new JournalNote();

    this.L.info({ ctx, journalName, fname });
    const title = journalType.onCreate.setTitle(fname, "", "");

    const confirmVaultOnCreate =
      ConfigUtils.getCommands(config).lookup.note.confirmVaultOnCreate;
    const { engine } = getDWorkspace();
    let vault;
    if (_.isUndefined(journalConfig.dailyVault) && confirmVaultOnCreate) {
      vault = await PickerUtilsV2.promptVault(engine.vaults);
      if (vault === undefined) {
        vscode.window.showInformationMessage(
          "Daily Journal creation cancelled"
        );
        return;
      }
    } else {
      const dailyVault = journalConfig.dailyVault;
      vault = dailyVault
        ? VaultUtils.getVaultByName({
            vaults: engine.vaults,
            vname: dailyVault,
          })
        : undefined;
    }

    await new GotoNoteCommand().execute({
      qs: fname,
      vault,
      overrides: { title, types: [journalType] },
    });
  }
}
