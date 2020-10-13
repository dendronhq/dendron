import { cleanName } from "@dendronhq/common-server";
import * as vscode from "vscode";
import { CONFIG } from "../constants";
import { DendronClientUtilsV2 } from "../utils";
import { DendronWorkspace } from "../workspace";
import { CreateNoteCommand } from "./CreateNote";
import { GotoNoteCommand } from "./GotoNote";

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
    let fname: string;
    if (DendronWorkspace.lsp()) {
      fname = DendronClientUtilsV2.genNoteName("JOURNAL", {
        overrides: { domain: dailyJournalDomain },
      });
    } else {
      fname = this.genFname("JOURNAL", {
        overrides: { domain: dailyJournalDomain },
      });
    }
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
    if (DendronWorkspace.lsp()) {
      // const lookupOpts = {
      //   noConfirm: true,
      //   value: fname,
      // };
      await new GotoNoteCommand().execute({ qs: fname, mode: "note" as const });
      return vscode.Uri.file("/tmp");
    }
    const uri = await super.execute({ ...opts, title: fname });
    await vscode.window.showTextDocument(uri);
    return uri;
  }
}
