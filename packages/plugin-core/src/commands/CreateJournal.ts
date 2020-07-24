import clipboardy from 'clipboardy';
import _ from "lodash";
import path from "path";
import { window } from "vscode";
import { BaseCommand } from "./base";

type CommandOpts = {
    fname: string
};

type CommandInput = {
}

type CommandOutput = void;

export class CreateJournalCommand extends BaseCommand<
  CommandOpts,
  CommandOutput,
  CommandInput
> {
  async gatherInputs(): Promise<CommandInput|undefined> {
    const resp = await window.showInputBox({
      prompt: "Select your folder for dendron",
      ignoreFocusOut: true,
      validateInput: (input: string) => {
        if (!path.isAbsolute(input)) {
          if (input[0] !== "~") {
            return "must enter absolute path";
          }
        }
        return undefined;
      },
    });
    if (_.isUndefined(resp)) {
        return
    }
    return;
  }

  async execute(opts: CommandOpts) {
    const {fname} = _.defaults(opts, {});
    clipboardy.writeSync(`[[${fname}]]`);
    return;
  }
}
