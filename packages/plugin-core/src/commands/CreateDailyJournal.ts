import { cleanName } from "@dendronhq/common-server";
import * as vscode from "vscode";
import { CONFIG } from "../constants";
import { DendronWorkspace } from "../workspace";
import { CreateNoteCommand } from "./CreateNote";

type CommandOpts = {
  fname: string;
};

type CommandInput = {
  title: string;
};

export class CreateDailyJournalCommand extends CreateNoteCommand {
  async gatherInputs(): Promise<CommandInput | undefined> {
    const dailyJournalDomain = DendronWorkspace.configuration().get<string>(
      CONFIG["DAILY_JOURNAL_DOMAIN"].key
    );
    const fname = this.genFname("JOURNAL", {
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
    const uri = await super.execute({ ...opts, title: fname });
    await vscode.window.showTextDocument(uri);
    return uri;
  }
}
