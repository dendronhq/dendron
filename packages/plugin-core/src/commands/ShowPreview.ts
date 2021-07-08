import _ from "lodash";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { MarkdownUtils } from "../utils/md";
import { BasicCommand } from "./base";

type CommandOpts = {};
type CommandOutput = any;

export class ShowPreviewCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.SHOW_PREVIEW.key;
  async sanityCheck() {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor())) {
      return "No document open";
    }
    return;
  }

  async execute(_opts: CommandOpts) {
    // eslint-disable-next-line  no-return-await
    return await MarkdownUtils.openPreview();
  }
}
