import { assertUnreachable } from "@dendronhq/common-all";
import {
  CopyAsFormat,
  getAllCopyAsFormat,
  JSONV2PodConfig,
  PodExportScope,
  PodV2Types,
} from "@dendronhq/pods-core";
import { PodCommandFactory } from "../components/pods/PodCommandFactory";
import { PodUIControls } from "../components/pods/PodControls";
import { DENDRON_COMMANDS } from "../constants";
import { BaseCommand, CodeCommandInstance } from "./base";

type CommandOutput = void;
type CommandInput = CodeCommandInstance;
type CommandOpts = CodeCommandInstance;

/**
 * Command that will find the appropriate export command to run, and then run
 * it. This is the UI entry point for all export pod functionality.
 */
export class CopyAsCommand extends BaseCommand<
  CommandOpts,
  CommandOutput,
  CommandInput
> {
  public format: CopyAsFormat[];
  key = DENDRON_COMMANDS.COPY_AS.key;

  constructor(_name?: string) {
    super(_name);
    this.format = getAllCopyAsFormat();
  }

  async gatherInputs() {
    const format = await PodUIControls.promtToSelectCopyAsFormat();

    if (!format) {
      return;
    }
    switch (format) {
      case CopyAsFormat.JSON: {
        const config: JSONV2PodConfig = {
          destination: "clipboard",
          exportScope: PodExportScope.Note,
          podType: PodV2Types.JSONExportV2,
          podId: "copyAs.json", // dummy value, required property
        };
        return PodCommandFactory.createPodCommandForStoredConfig({ config });
      }
      default:
        assertUnreachable(format);
    }
  }

  /**
   * no-op
   */
  async enrichInputs(inputs: CommandInput): Promise<CommandOpts | undefined> {
    return inputs;
  }

  async execute(opts: CommandOpts) {
    opts.run();
  }
}
