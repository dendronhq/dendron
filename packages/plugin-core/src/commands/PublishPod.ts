import { DNodeUtils, VaultUtils } from "@dendronhq/common-all";
import {
  getAllPublishPods,
  JSONPublishPod,
  podClassEntryToPodItemV4,
  PodItemV4,
  PodUtils,
} from "@dendronhq/pods-core";
import * as vscode from "vscode";
import { Uri, window } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { showPodQuickPickItemsV4 } from "../utils/pods";
import { DendronWorkspace } from "../workspace";
import { BaseCommand } from "./base";

type CommandOpts = { podClass: any; noteByName: string; config: any };

type CommandInput = { podChoice: PodItemV4 };

type CommandOutput = string;
export { CommandOpts as PublishPodCommandOpts };

export class PublishPodCommand extends BaseCommand<CommandOpts, CommandOutput> {
  static key = DENDRON_COMMANDS.PUBLISH_POD.key;
  async gatherInputs(): Promise<any> {
    const pods = getAllPublishPods();
    const podItems: PodItemV4[] = pods.map((p) => podClassEntryToPodItemV4(p));
    const podChoice = await showPodQuickPickItemsV4(podItems);
    if (!podChoice) {
      return;
    }
    return { podChoice };
  }

  async enrichInputs(inputs: CommandInput): Promise<CommandOpts | undefined> {
    const podChoice = inputs.podChoice;
    const podsDir = DendronWorkspace.instance().podsDir;
    const podClass = podChoice.podClass;
    const maybeConfig = PodUtils.getConfig({ podsDir, podClass });
    let noteByName = VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
    if (!noteByName) {
      window.showErrorMessage(
        "you must have a note open to execute this command"
      );
      return;
    }
    noteByName = DNodeUtils.fname(noteByName);

    if (!maybeConfig && PodUtils.hasRequiredOpts(podClass)) {
      const configPath = PodUtils.genConfigFile({ podsDir, podClass });
      await VSCodeUtils.openFileInEditor(Uri.file(configPath));
      window.showInformationMessage(
        "Looks like this is your first time running this pod. Please fill out the configuration and then run this command again. "
      );
      return;
    }
    return { podClass, config: maybeConfig, noteByName };
  }

  async execute(opts: CommandOpts) {
    const { podClass, config, noteByName } = opts;

    const engine = DendronWorkspace.instance().getEngine();
    const wsRoot = DendronWorkspace.wsRoot() as string;
    const pod = new podClass() as JSONPublishPod;
    const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
    try {
      const link = await pod.execute({
        config: {
          ...config,
          fname: noteByName,
          vaultName: VaultUtils.getName(vault),
          dest: "stdout",
        },
        vaults: DendronWorkspace.instance().vaultsv4,
        wsRoot,
        engine,
      });
      await vscode.env.clipboard.writeText(link);
      this.showResponse();
      return link;
    } catch (err) {
      this.L.error({ err });
      throw err;
    }
  }

  async showResponse() {
    window.showInformationMessage("contents copied to clipboard");
  }
}
