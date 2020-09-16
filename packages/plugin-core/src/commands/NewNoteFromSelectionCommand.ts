import { cleanName } from "@dendronhq/common-server";
import _ from "lodash";
import vscode, { window } from "vscode";
import { VSCodeUtils } from "../utils";
import { CreateNoteCommand } from "./CreateNote";

type CommandOpts = {
  fname: string;
};

type CommandInput = {
  title: string;
};

export class NewNoteFromSelectionCommand extends CreateNoteCommand {
  async gatherInputs(): Promise<any> {
    const title = await VSCodeUtils.showInputBox({
      prompt: "Title",
      ignoreFocusOut: true,
      value: "",
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

  // @ts-ignore
  async execute(opts: CommandOpts) {
    const { fname } = opts;
    const resp = await extractRangeToNewNote();
    if (_.isUndefined(resp)) {
      return;
    }
    const { document, range } = resp;
    const body = "\n" + document.getText(range).trim();
    const uri = await super.execute({ ...opts, title: fname, body });
    await deleteRange(document, range);
    await vscode.window.showTextDocument(uri);
    return uri;
  }
}

const deleteRange = async (
  document: vscode.TextDocument,
  range: vscode.Range
) => {
  const editor = await window.showTextDocument(document);
  await editor.edit((edit) => edit.delete(range));
};

const extractRangeToNewNote = async (
  documentParam?: vscode.TextDocument,
  rangeParam?: vscode.Range
) => {
  const document = documentParam
    ? documentParam
    : window.activeTextEditor?.document;

  if (!document || (document && document.languageId !== "markdown")) {
    return;
  }

  const range = rangeParam ? rangeParam : window.activeTextEditor?.selection;

  if (!range || (range && range.isEmpty)) {
    return;
  }
  return { document, range };
};

export default extractRangeToNewNote;
