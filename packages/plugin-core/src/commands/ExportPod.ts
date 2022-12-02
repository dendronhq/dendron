import {
  getAllExportPods,
  podClassEntryToPodItemV4,
  PodClassEntryV4,
  PodItemV4,
  PodUtils,
} from "@dendronhq/pods-core";
import { Uri, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../vsCodeUtils";
import {
  getSelectionFromQuickpick,
  showPodQuickPickItemsV4,
  withProgressOpts,
} from "../utils/pods";
import { BaseCommand } from "./base";
import { IDendronExtension } from "../dendronExtensionInterface";

type CommandOutput = void;

type CommandInput = { podChoice: PodItemV4; quiet?: boolean };

type CommandOpts = CommandInput & { config: any };

export class ExportPodCommand extends BaseCommand<
  CommandOpts,
  CommandOutput,
  CommandInput
> {
  public pods: PodClassEntryV4[];
  key = DENDRON_COMMANDS.EXPORT_POD.key;
  private extension: IDendronExtension;

  constructor(ext: IDendronExtension, _name?: string) {
    super(_name);
    this.pods = getAllExportPods();
    this.extension = ext;
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
    const podsDir = this.extension.podsDir;
    const podClass = podChoice.podClass;
    const maybeConfig = PodUtils.getConfig({ podsDir, podClass });
    if (maybeConfig.error) {
      const configPath = PodUtils.genConfigFile({ podsDir, podClass });
      await VSCodeUtils.openFileInEditor(Uri.file(configPath));
      window.showInformationMessage(
        "Looks like this is your first time running this pod. Please fill out the configuration and then run this command again. "
      );
      return;
    }
    return { podChoice, config: maybeConfig.data };
  }

  async execute(opts: CommandOpts) {
    const ctx = { ctx: "ExportPod" };
    this.L.info({ ctx, opts });
    const ws = this.extension.getDWorkspace();
    const { wsRoot } = ws;
    const vaults = await ws.vaults;
    if (!wsRoot) {
      throw Error("ws root not defined");
    }
    const utilityMethods = {
      getSelectionFromQuickpick,
      withProgressOpts,
    };
    const pod = new opts.podChoice.podClass(); // eslint-disable-line new-cap
    const engine = this.extension.getEngine();
    await pod.execute({
      config: opts.config,
      engine,
      wsRoot,
      vaults,
      utilityMethods,
    });
    const dest = opts.config.dest;
    if (!opts.quiet) {
      window.showInformationMessage(`done exporting. destination: ${dest}`);
    }
  }

  addAnalyticsPayload(opts?: CommandOpts) {
    return PodUtils.getAnalyticsPayload(opts);
  }
}
