import { DNodeUtils } from "@dendronhq/common-all";
import { cleanName } from "@dendronhq/common-server";
import clipboardy from "clipboardy";
import _ from "lodash";
import moment from "moment";
import path from "path";
import * as vscode from "vscode";
import { DendronWorkspace } from "../workspace";
import { CreateNoteCommand } from "./CreateNote";
import { CONFIG } from "../constants";
import { VSCodeUtils } from "../utils";


type CommandOpts = {
  fname: string;
}

type CommandInput = {
  title: string
};

export class CreateJournalCommand extends CreateNoteCommand {

  async gatherInputs(): Promise<CommandInput | undefined> {
    const defaultNameConfig = DendronWorkspace.configuration().get<string>(
      CONFIG.DEFAULT_JOURNAL_DATE_FORMAT.key
    );
    const journalNamespace = "journal";
    const noteName = moment().format(defaultNameConfig);
    const editorPath = vscode.window.activeTextEditor?.document.uri.fsPath;
    if (!editorPath) {
      throw Error("not currently in a note");
    }
    const cNoteFname = path.basename(editorPath, ".md");
    const currentDomain = DNodeUtils.domainName(cNoteFname);
    let fname = `${currentDomain}.${journalNamespace}.${noteName}`;
    const title = await VSCodeUtils.showInputBox({
      prompt: "Title",
      ignoreFocusOut: true,
      value: fname,
    });
    if (_.isUndefined(title)) {
      return;
    }
    return {title};
  }

  async enrichInputs(inputs: CommandInput) {
    let {title} = inputs;
    return {
      title,
      fname: `${cleanName(title)}`
    }
  }

  async execute(opts: CommandOpts) {
    const {fname} = opts;
    const uri = await super.execute({ ...opts, title: fname });
    clipboardy.writeSync(`[[${opts.fname}]]`);
    await vscode.window.showTextDocument(uri);
    vscode.window.showInformationMessage(`${fname} copied to clipboard`);
    return uri;
  }
}
