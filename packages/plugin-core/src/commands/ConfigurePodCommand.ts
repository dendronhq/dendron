import {
  genPodConfig,
  getAllExportPods,
  PodClassEntryV2,
} from "@dendronhq/pods-core";
import { Uri } from "vscode";
import { VSCodeUtils } from "../utils";
import {
  podClassEntryToPodItem,
  PodItem,
  showPodQuickPickItems,
} from "../utils/pods";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOutput = void;

type CommandInput = { podClass: PodClassEntryV2 };

type CommandOpts = CommandInput;

export class ConfigurePodCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  public pods: PodClassEntryV2[];

  constructor(_name?: string) {
    super(_name);
    this.pods = getAllExportPods();
  }

  async gatherInputs(): Promise<CommandInput | undefined> {
    const pods = getAllExportPods();
    const podItems: PodItem[] = pods.map((p) => podClassEntryToPodItem(p));
    const userPick = await showPodQuickPickItems(podItems);
    if (!userPick) {
      return;
    }
    const podClass = userPick.podClass;
    return { podClass };
  }

  async execute(opts: CommandOpts) {
    const podClass = opts.podClass;
    const ctx = { ctx: "ConfigurePod" };
    this.L.info({ ctx, opts });
    const podsDir = DendronWorkspace.instance().podsDir;
    const configPath = genPodConfig(podsDir, podClass);
    await VSCodeUtils.openFileInEditor(Uri.file(configPath));
  }
}
