import {
  getAllExportPods,
  getAllImportPods,
  podClassEntryToPodItemV4,
  PodClassEntryV4,
  PodItemV4,
  PodUtils,
} from "@dendronhq/pods-core";
import { Uri } from "vscode";
import { VSCodeUtils } from "../utils";
import { showPodQuickPickItemsV4 } from "../utils/pods";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOutput = void;

type CommandInput = { podClass: PodClassEntryV4 };

type CommandOpts = CommandInput;

export class ConfigurePodCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  public pods: PodClassEntryV4[];

  constructor(_name?: string) {
    super(_name);
    this.pods = getAllExportPods();
  }

  async gatherInputs(): Promise<CommandInput | undefined> {
    const podsImport = getAllImportPods();
    const podsExport = getAllExportPods();
    const podItems: PodItemV4[] = podsExport
      .map((p) => podClassEntryToPodItemV4(p))
      .concat(podsImport.map((p) => podClassEntryToPodItemV4(p)));
    const userPick = await showPodQuickPickItemsV4(podItems);
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
    const configPath = PodUtils.genConfigFile({ podsDir, podClass });
    await VSCodeUtils.openFileInEditor(Uri.file(configPath));
  }
}
