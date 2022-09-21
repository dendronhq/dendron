import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { InputArgCommand } from "./base";
import {
  CommandOutput as NoteLookupOutput,
  CommandRunOpts as NoteLookupRunOpts,
  NoteLookupCommand,
} from "./NoteLookupCommand";
import _ from "lodash";
import { window } from "vscode";
import { AnalyticsUtils } from "../utils/analytics";
import { ExtensionProvider } from "../ExtensionProvider";

type CommandOpts = string & {};

type CommandOutput = {
  lookup: Promise<NoteLookupOutput | undefined>;
};
export class CreateNoteCommand extends InputArgCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CREATE_NOTE.key;

  async execute(opts: CommandOpts) {
    const ctx = "CreateNoteCommand";

    Logger.info({ ctx, msg: "enter", opts });
    const args: NoteLookupRunOpts = {};
    /**
     * If the command is ran from Tree View, update the initial value in lookup to
     * selected tree item's fname. The opts passed is the id of note
     */
    const engine = ExtensionProvider.getEngine();
    if (_.isString(opts)) {
      const resp = await engine.getNoteMeta(opts);
      args.initialValue = resp.data?.fname || "";
      AnalyticsUtils.track(this.key, { source: "TreeView" });
    }
    window.showInformationMessage(
      "💡 Tip: Enter `Ctrl+L` / `Cmd+L` to open the lookup bar!"
    );
    return {
      lookup: new NoteLookupCommand().run(args),
    };
  }
}
