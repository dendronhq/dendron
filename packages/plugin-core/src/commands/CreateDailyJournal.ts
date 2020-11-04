import { cleanName } from "@dendronhq/common-server";
import * as vscode from "vscode";
import { CONFIG } from "../constants";
import { DendronClientUtilsV2 } from "../utils";
import { DendronWorkspace } from "../workspace";
import { GotoNoteCommand } from "./GotoNote";

type CommandOpts = {
  fname: string;
};

type CommandInput = {
  title: string;
};

export class CreateDailyJournalCommand {
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
    await new GotoNoteCommand().execute({ qs: fname, mode: "note" as const });
    return vscode.Uri.file("/tmp");
  }
}
