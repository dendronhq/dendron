import {
  getAllExportPods,
  podClassEntryToPodItemV4,
  PodClassEntryV4,
  PodItemV4,
  PodUtils,
} from "@dendronhq/pods-core";
import { Uri, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import {
  getSelectionFromQuickpick,
  showPodQuickPickItemsV4,
  withProgressOpts,
} from "../utils/pods";
import { getExtension, getDWorkspace } from "../workspace";
import { BaseCommand } from "./base";

type CommandOutput = void;

type CommandInput = { podChoice: PodItemV4 };

type CommandOpts = CommandInput & { config: any };

export class ExportPodCommand extends BaseCommand<
  CommandOpts,
  CommandOutput,
  CommandInput
> {
  public pods: PodClassEntryV4[];
  key = DENDRON_COMMANDS.EXPORT_POD.key;

  constructor(_name?: string) {
    super(_name);
    this.pods = getAllExportPods();
  }

  async gatherInputs(): Promise<CommandInput | undefined> {
    const pods = getAllExportPods();
    const podItems: PodItemV4[] = pods.map((p) => podClassEntryToPodItemV4(p));
    const podChoice = await showPodQuickPickItemsV4(podItems);
    if (!podChoice) {
      return;
    }
    return { podChoice };
  }

  async enrichInputs(inputs: CommandInput): Promise<CommandOpts | undefined> {
    const podChoice = inputs.podChoice;
    const podsDir = getExtension().podsDir;
    const podClass = podChoice.podClass;
    const maybeConfig = PodUtils.getConfig({ podsDir, podClass });
    if (!maybeConfig) {
      const configPath = PodUtils.genConfigFile({ podsDir, podClass });
      await VSCodeUtils.openFileInEditor(Uri.file(configPath));
      window.showInformationMessage(
        "Looks like this is your first time running this pod. Please fill out the configuration and then run this command again. "
      );
      return;
    }
    return { podChoice, config: maybeConfig };
  }

  async execute(opts: CommandOpts) {
    const ctx = { ctx: "ExportPod" };
    this.L.info({ ctx, opts });
    const { wsRoot, vaults } = getDWorkspace();
    if (!wsRoot) {
      throw Error("ws root not defined");
    }
    const utilityMethods = {
      getSelectionFromQuickpick,
      withProgressOpts,
    };
    const pod = new opts.podChoice.podClass(); // eslint-disable-line new-cap
    const engine = getExtension().getEngine();
    await pod.execute({
      config: opts.config,
      engine,
      wsRoot,
      vaults,
      utilityMethods,
    });
    const dest = opts.config.dest;
    window.showInformationMessage(`done exporting. destination: ${dest}`);
  }

  addAnalyticsPayload(opts?: CommandOpts) {
    return PodUtils.getAnalyticsPayload(opts);
  }
}
