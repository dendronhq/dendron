import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { InputArgCommand } from "./base";
import {
  CommandOutput as NoteLookupOutput,
  CommandRunOpts as NoteLookupRunOpts,
} from "./NoteLookupCommand";
import { AutoCompletableRegistrar } from "../utils/registers/AutoCompletableRegistrar";
import _ from "lodash";
import { window } from "vscode";

type CommandOpts = any;

type CommandOutput = {
  lookup: Promise<NoteLookupOutput | undefined>;
};
export class CreateNoteCommand extends InputArgCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CREATE_NOTE.key;

  private isNotePropsArgs(opts: CommandOpts) {
    return !_.isEmpty(opts) && opts.id;
  }

  async execute(opts: CommandOpts) {
    const ctx = "CreateNoteCommand";

    Logger.info({ ctx, msg: "enter", opts });
    const args: NoteLookupRunOpts = {};
    /**
     * If the command is ran from Tree View, update the initial value in lookup to
     * selected tree item's fname
     */
    if (this.isNotePropsArgs(opts)) {
      args.initialValue = opts.fname;
      window.showInformationMessage(
        "💡 Tip: Enter `Ctrl+L` / `Cmd+L` to open the lookup bar!"
      );
    }
    return {
      lookup: AutoCompletableRegistrar.getNoteLookupCmd().run(args),
    };
  }
}
