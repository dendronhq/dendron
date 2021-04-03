import { NoteUtils } from "@dendronhq/common-all";
import { cleanName } from "@dendronhq/common-server";
import * as vscode from "vscode";
import { CONFIG, DENDRON_COMMANDS } from "../constants";
import { CodeConfigKeys } from "../types";
import { DendronClientUtilsV2 } from "../utils";
import { DendronWorkspace, getConfigValue } from "../workspace";
import { BaseCommand } from "./base";
import { GotoNoteCommand } from "./GotoNote";

type CommandOpts = {
  fname: string;
};

type CommandInput = {
  title: string;
};

export class CreateDailyJournalCommand extends BaseCommand<CommandOpts> {
  static key = DENDRON_COMMANDS.CREATE_DAILY_JOURNAL_NOTE.key;
  async gatherInputs(): Promise<CommandInput | undefined> {
    const dailyJournalDomain = DendronWorkspace.configuration().get<string>(
      CONFIG["DAILY_JOURNAL_DOMAIN"].key
    );
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
    const journalName = getConfigValue(
      CodeConfigKeys.DEFAULT_JOURNAL_NAME
    ) as string;
    const title = NoteUtils.genJournalNoteTitle({
      fname,
      journalName,
    });
    await new GotoNoteCommand().execute({
      qs: fname,
      overrides: { title },
    });
    // dummy
    return vscode.Uri.file("/tmp");
  }
}
