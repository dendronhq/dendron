import {
  getAllExportPods,
  getAllImportPods,
  getAllPublishPods,
  podClassEntryToPodItemV4,
  PodClassEntryV4,
  PodItemV4,
  PodUtils,
} from "@dendronhq/pods-core";
import { Uri } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../vsCodeUtils";
import { showPodQuickPickItemsV4 } from "../utils/pods";
import { BasicCommand } from "./base";
import { IDendronExtension } from "../dendronExtensionInterface";

type CommandOutput = void;

type CommandInput = { podClass: PodClassEntryV4 };

type CommandOpts = CommandInput;

export class ConfigurePodCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  public pods: PodClassEntryV4[];
  private extension: IDendronExtension;
  key = DENDRON_COMMANDS.CONFIGURE_POD.key;

  constructor(ext: IDendronExtension, _name?: string) {
    super(_name);
    this.pods = getAllExportPods();
    this.extension = ext;
  }

  async gatherInputs(): Promise<CommandInput | undefined> {
    const podsImport = getAllImportPods();
    const podsExport = getAllExportPods();
    /**added publish pod to configure publish configs */
    const podsPublish = getAllPublishPods();
    const podItems: PodItemV4[] = podsExport
      .map((p) => podClassEntryToPodItemV4(p))
      .concat(podsImport.map((p) => podClassEntryToPodItemV4(p)))
      .concat(podsPublish.map((p) => podClassEntryToPodItemV4(p)));
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
    const podsDir = this.extension.podsDir;
    const configPath = PodUtils.genConfigFile({ podsDir, podClass });
    await VSCodeUtils.openFileInEditor(Uri.file(configPath));
  }
}
