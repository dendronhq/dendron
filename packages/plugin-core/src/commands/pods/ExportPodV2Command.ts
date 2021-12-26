import { getAllExportPods, PodClassEntryV4 } from "@dendronhq/pods-core";
import { PodCommandFactory } from "../../components/pods/PodCommandFactory";
import { PodUIControls } from "../../components/pods/PodControls";
import { DENDRON_COMMANDS } from "../../constants";
import { IDendronExtension } from "../../dendronExtensionInterface";
import { BaseCommand, CodeCommandInstance } from "../base";

type CommandOutput = void;
type CommandInput = CodeCommandInstance;
type CommandOpts = CodeCommandInstance;

/**
 * Command that will find the appropriate export command to run, and then run
 * it. This is the UI entry point for all export pod functionality.
 */
export class ExportPodV2Command extends BaseCommand<
  CommandOpts,
  CommandOutput,
  CommandInput,
  string
> {
  public pods: PodClassEntryV4[];
  key = DENDRON_COMMANDS.EXPORT_POD_V2.key;

  constructor(extension: IDendronExtension, _name?: string) {
    super(extension, _name);
    this.pods = getAllExportPods();
  }

  /**
   * Get from the user which
   * @returns a CommandInput for a Pod Export Command to run in turn, or
   * undefined if the user didn't select anything.
   */
  async gatherInputs(podId: string): Promise<CommandInput | undefined> {
    const extension = this.extension!;
    // If a podId is passed in, use this instead of prompting the user
    if (podId) {
      return PodCommandFactory.createPodCommandForStoredConfig(
        { podId },
        extension
      );
    }

    const exportChoice = await PodUIControls.promptForExportConfigOrNewExport();

    if (exportChoice === undefined) {
      return;
    } else if (exportChoice === "New Export") {
      const podType = await PodUIControls.promptForPodType();

      if (!podType) {
        return;
      }
      return PodCommandFactory.createPodCommandForPodType(podType, extension);
    } else {
      return PodCommandFactory.createPodCommandForStoredConfig(
        exportChoice,
        extension
      );
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
