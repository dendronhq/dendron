import clipboardy from "clipboardy";
import _ from "lodash";
import moment from "moment";
import * as vscode from "vscode";
import { CONFIG } from "../constants";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { CreateNoteCommand } from "./CreateNote";

type CommandOpts = {
  fname: string;
  selection: vscode.Selection;
  title: string;
};

type CommandInput = {
  title: string;
  selection: vscode.Selection;
};

export class CreateScratchCommand extends CreateNoteCommand {
  async gatherInputs(): Promise<CommandInput | undefined> {
    let title: string;
    const { text, selection } = VSCodeUtils.getSelection();
    if (!_.isEmpty(text)) {
      title = text;
    } else {
      const resp = await VSCodeUtils.showInputBox({
        prompt: "Title",
        ignoreFocusOut: true,
        placeHolder: "scratch",
      });
      if (_.isUndefined(resp)) {
        return;
      }
      title = resp;
    }

    return { title, selection };
  }

  async enrichInputs(inputs: CommandInput) {
    const defaultNameConfig = DendronWorkspace.configuration().get<string>(
      CONFIG.DEFAULT_SCRATCH_DATE_FORMAT.key
    );
    const scratchDomain = "scratch";
    const noteName = moment().format(defaultNameConfig);
    const fname = `${scratchDomain}.${noteName}`;
    return {
      ...inputs,
      fname,
    };
  }

  async execute(opts: CommandOpts) {
    const { fname, selection, title } = opts;
    const uri = await super.execute({ ...opts, title: fname });

    const editor = VSCodeUtils.getActiveTextEditor();
    await editor?.edit((builder) => {
      const link = _.isEmpty(title) ? `${fname}` : `${title} | ${fname}`;
      if (!selection.isEmpty) {
        builder.replace(selection, `[[${link}]]`);
      }
    });

    if (_.isEmpty(title)) {
      clipboardy.writeSync(`[[${opts.fname}]]`);
    } else {
      clipboardy.writeSync(`[[${title} | ${opts.fname}]]`);
    }
    await vscode.window.showTextDocument(uri);
    vscode.window.showInformationMessage(`${fname} copied to clipboard`);
    return uri;
  }
}
