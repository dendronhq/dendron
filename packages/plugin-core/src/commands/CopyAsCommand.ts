import { DendronError } from "@dendronhq/common-all";
import {
  CopyAsFormat,
  getAllCopyAsFormat,
  JSONV2PodConfig,
  MarkdownV2PodConfig,
  PodExportScope,
  PodV2Types,
} from "@dendronhq/pods-core";
import _ from "lodash";
import { PodCommandFactory } from "../components/pods/PodCommandFactory";
import { PodUIControls } from "../components/pods/PodControls";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand, CodeCommandInstance } from "./base";

type CommandOutput = void;
type CommandOpts = CodeCommandInstance;

/**
 * Command that will find the appropriate export command to run, and then run
 * it. This is the UI entry point for all export pod functionality.
 */
export class CopyAsCommand extends BasicCommand<
  CommandOpts,
  CommandOutput,
  CopyAsFormat
> {
  public format: CopyAsFormat[];
  key = DENDRON_COMMANDS.COPY_AS.key;

  constructor(_name?: string) {
    super(_name);
    this.format = getAllCopyAsFormat();
  }

  async sanityCheck() {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor())) {
      return "you must have a note open to execute this command";
    }
    return;
  }

  async gatherInputs(copyAsFormat?: CopyAsFormat) {
    const format =
      copyAsFormat || (await PodUIControls.promptToSelectCopyAsFormat());

    if (!format) {
      return;
    }
    switch (format) {
      case CopyAsFormat.JSON: {
        const config: JSONV2PodConfig = {
          destination: "clipboard",
          exportScope: PodExportScope.Selection,
          podType: PodV2Types.JSONExportV2,
          podId: "copyAs.json", // dummy value, required property
        };
        return PodCommandFactory.createPodCommandForStoredConfig({ config });
      }
      case CopyAsFormat.MARKDOWN: {
        const config: MarkdownV2PodConfig = {
          destination: "clipboard",
          exportScope: PodExportScope.Selection,
          podType: PodV2Types.MarkdownExportV2,
          podId: "copyAs.markdown", // dummy value, required property
          addFrontmatterTitle: false,
        };
        return PodCommandFactory.createPodCommandForStoredConfig({ config });
      }
      default:
        throw new DendronError({
          message: `${format} is not a valid copy as format. If you are using a keybinding, make sure the argument is one of the following values: ${getAllCopyAsFormat()}`,
        });
    }
  }

  async execute(opts: CommandOpts) {
    opts.run();
  }
}
