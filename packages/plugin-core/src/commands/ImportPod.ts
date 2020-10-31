import {
  genPodConfigFile,
  getAllImportPods,
  getPodConfig,
  PodClassEntryV2,
  podClassEntryToPodItem,
} from "@dendronhq/pods-core";
import { Uri, window } from "vscode";
import { VSCodeUtils } from "../utils";
import { PodItem, showPodQuickPickItems } from "../utils/pods";
import { DendronWorkspace } from "../workspace";
import { BaseCommand } from "./base";

type CommandOutput = void;

type CommandInput = { podChoice: PodItem };

type CommandOpts = CommandInput & { config: any };

export class ImportPodCommand extends BaseCommand<CommandOpts, CommandOutput> {
  public pods: PodClassEntryV2[];

  constructor(_name?: string) {
    super(_name);
    this.pods = getAllImportPods();
  }

  async gatherInputs(): Promise<CommandInput | undefined> {
    const pods = getAllImportPods();
    const podItems: PodItem[] = pods.map((p) => podClassEntryToPodItem(p));
    const podChoice = await showPodQuickPickItems(podItems);
    if (!podChoice) {
      return;
    }
    return { podChoice };
  }

  async enrichInputs(inputs: CommandInput): Promise<CommandOpts | undefined> {
    const podChoice = inputs.podChoice;
    const podsDir = DendronWorkspace.instance().podsDir;
    const maybeConfig = getPodConfig(podsDir, podChoice.podClass);
    if (!maybeConfig) {
      const configPath = genPodConfigFile(podsDir, podChoice.podClass);
      await VSCodeUtils.openFileInEditor(Uri.file(configPath));
      window.showInformationMessage(
        "Looks like this is your first time running this pod. Please fill out the configuration and then run this command again. "
      );
      return;
    }
    return { podChoice, config: maybeConfig };
  }

  async execute(opts: CommandOpts) {
    const ctx = { ctx: "ImportPod" };
    this.L.info({ ctx, opts });
    const root = DendronWorkspace.rootWorkspaceFolder()?.uri.fsPath as string;
    const wsRoot = DendronWorkspace.rootDir();
    if (!wsRoot) {
      throw Error("ws root not defined");
    }
    const pod = new opts.podChoice.podClass({
      roots: [root],
      wsRoot,
    });
    await pod.plant({ mode: "notes", config: opts.config });
    window.showInformationMessage(`done importing.`);
  }
}
