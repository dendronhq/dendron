import { cleanName } from "@dendronhq/common-server";
import _ from "lodash";
import { window } from "vscode";
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
    return window.showErrorMessage(
      "This command is now removed. You can now use lookup with highlighted text to achieve the same functionality"
    );
  }
}
