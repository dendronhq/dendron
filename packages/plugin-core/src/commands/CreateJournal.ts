import { cleanName } from "@dendronhq/common-server";
import _ from "lodash";
import * as vscode from "vscode";
import { VSCodeUtils } from "../utils";
import { CreateNoteCommand } from "./CreateNote";

type CommandOpts = {
  fname: string;
};

type CommandInput = {
  title: string;
};

export class CreateJournalCommand extends CreateNoteCommand {
  async gatherInputs(): Promise<CommandInput | undefined> {
    const fname = this.genFname("JOURNAL");
    const title = await VSCodeUtils.showInputBox({
      prompt: "Title",
      ignoreFocusOut: true,
      value: fname,
    });
    if (_.isUndefined(title)) {
      return;
    }
    return { title };
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
    vscode.window.showInformationMessage(`${fname} copied to clipboard`);
    return uri;
  }
}
