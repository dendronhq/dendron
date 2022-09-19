import {
  getAllExportPods,
  PodClassEntryV4,
  PodExportScope,
} from "@dendronhq/pods-core";
import { PodCommandFactory } from "../../components/pods/PodCommandFactory";
import { PodUIControls } from "../../components/pods/PodControls";
import { DENDRON_COMMANDS } from "../../constants";
import { ExtensionProvider } from "../../ExtensionProvider";
import { BaseCommand, CodeCommandInstance } from "../base";

type CommandOutput = void;
type CommandInput = CodeCommandInstance;
type CommandOpts = CodeCommandInstance;
type GatherOpts = {
  podId: string;
  exportScope?: PodExportScope;
};
/**
 * Command that will find the appropriate export command to run, and then run
 * it. This is the UI entry point for all export pod functionality.
 */
export class ExportPodV2Command extends BaseCommand<
  CommandOpts,
  CommandOutput,
  CommandInput,
  GatherOpts
> {
  public pods: PodClassEntryV4[];
  key = DENDRON_COMMANDS.EXPORT_POD_V2.key;

  constructor(_name?: string) {
    super(_name);
    this.pods = getAllExportPods();
  }

  /**
   * Get from the user which
   * @returns a CommandInput for a Pod Export Command to run in turn, or
   * undefined if the user didn't select anything.
   */
  async gatherInputs(args?: GatherOpts): Promise<CommandInput | undefined> {
    // added check to return if export pod v2 is not enabled in dev config and is run using pod keyboard shortcuts
    const { config } = ExtensionProvider.getDWorkspace();
    if (!config.dev?.enableExportPodV2) {
      return;
    }

    // If a podId is passed in, use this instead of prompting the user
    if (args?.podId) {
      return PodCommandFactory.createPodCommandForStoredConfig({
        configId: { podId: args.podId },
        exportScope: args.exportScope,
      });
    }

    const exportChoice = await PodUIControls.promptForExportConfigOrNewExport();

    if (exportChoice === undefined) {
      return;
    } else if (exportChoice === "New Export") {
      const podType = await PodUIControls.promptForPodType();

      if (!podType) {
        return;
      }
      return PodCommandFactory.createPodCommandForPodType(podType);
    } else {
      return PodCommandFactory.createPodCommandForStoredConfig({
        configId: exportChoice,
      });
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

  addAnalyticsPayload(opts: CommandOpts) {
    return {
      configured: true,
      pod: opts.key,
    };
  }
}
