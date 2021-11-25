import { getAllExportPods, PodClassEntryV4 } from "@dendronhq/pods-core";
import { PodCommandFactory } from "../../components/pods/PodCommandFactory";
import { PodUIControls } from "../../components/pods/PodControls";
import { DENDRON_COMMANDS } from "../../constants";
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
  CommandInput
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
  async gatherInputs(): Promise<CommandInput | undefined> {
    const exportChoice = await PodUIControls.promptForExportConfigOrNewExport();

    if (exportChoice === undefined) {
      return;
    } else if (exportChoice === "New Export") {
      return PodUIControls.promptForPodTypeForCommand();
    } else {
      return PodCommandFactory.createPodCommandForStoredConfig(exportChoice);
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
