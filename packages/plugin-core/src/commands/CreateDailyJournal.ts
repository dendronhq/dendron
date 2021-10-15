import { NoteUtils, VaultUtils } from "@dendronhq/common-all";
import { cleanName } from "@dendronhq/common-server";
import { DConfig } from "@dendronhq/engine-server";
import _ from "lodash";
import * as vscode from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { DendronClientUtilsV2 } from "../utils";
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
    const config = getDWorkspace().config;
    const journalConfig = DConfig.getConfig({
      config,
      path: "workspace.journal",
      required: true,
    });
    const dailyJournalDomain = journalConfig.dailyDomain;
    const { noteName: fname } = DendronClientUtilsV2.genNoteName("JOURNAL", {
      overrides: { domain: dailyJournalDomain },
    });
    return { title: fname };
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
    const journalConfig = DConfig.getConfig({
      config,
      path: "workspace.journal",
      required: true,
    });
    const journalName = journalConfig.name;
    this.L.info({ ctx, journalName, fname });
    const title = NoteUtils.genJournalNoteTitle({
      fname,
      journalName,
    });

    const confirmVaultOnCreate = DConfig.getConfig({
      config,
      path: "commands.lookup.note.confirmVaultOnCreate",
      required: true,
    });
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
      overrides: { title },
    });
  }
}
