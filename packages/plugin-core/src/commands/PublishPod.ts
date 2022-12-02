import { DNodeUtils, VaultUtils } from "@dendronhq/common-all";
import {
  getAllPublishPods,
  podClassEntryToPodItemV4,
  PodItemV4,
  PodUtils,
  PublishPod,
} from "@dendronhq/pods-core";
import * as vscode from "vscode";
import { Uri, window } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { showMessage } from "../utils";
import { VSCodeUtils } from "../vsCodeUtils";
import { showPodQuickPickItemsV4 } from "../utils/pods";
import { BaseCommand } from "./base";
import { IDendronExtension } from "../dendronExtensionInterface";

type CommandOpts = CommandInput & { noteByName: string; config: any };

type CommandInput = { podChoice: PodItemV4 };

type CommandOutput = string;
export { CommandOpts as PublishPodCommandOpts };

export class PublishPodCommand extends BaseCommand<
  CommandOpts,
  CommandOutput,
  CommandInput
> {
  key = DENDRON_COMMANDS.PUBLISH_POD.key;
  private extension: IDendronExtension;

  constructor(ext: IDendronExtension) {
    super();
    this.extension = ext;
  }

  async gatherInputs(): Promise<CommandInput | undefined> {
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
    const podsDir = this.extension.podsDir;
    const podClass = podChoice.podClass;
    const maybeConfig = PodUtils.getConfig({ podsDir, podClass });
    if (maybeConfig.error && PodUtils.hasRequiredOpts(podClass)) {
      const configPath = PodUtils.genConfigFile({ podsDir, podClass });
      await VSCodeUtils.openFileInEditor(Uri.file(configPath));
      window.showInformationMessage(
        "Looks like this is your first time running this pod. Please fill out the configuration and then run this command again. "
      );
      return;
    }

    let noteByName = VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
    if (!noteByName) {
      window.showErrorMessage(
        "you must have a note open to execute this command"
      );
      return;
    }
    noteByName = DNodeUtils.fname(noteByName);
    return { config: maybeConfig.data, noteByName, ...inputs };
  }

  async execute(opts: CommandOpts) {
    const { podChoice, config, noteByName } = opts;

    const ws = this.extension.getDWorkspace();
    const { wsRoot, engine } = ws;
    const dendronConfig = await ws.config;
    const vaults = await ws.vaults;

    const pod = new podChoice.podClass() as PublishPod; // eslint-disable-line new-cap
    const vault = await PickerUtilsV2.getVaultForOpenEditor();
    const utilityMethods = {
      showMessage,
    };
    try {
      const link = await pod.execute({
        config: {
          ...config,
          fname: noteByName,
          vaultName: VaultUtils.getName(vault),
          dest: "stdout",
        },
        vaults,
        wsRoot,
        engine,
        dendronConfig,
        utilityMethods,
      });
      await vscode.env.clipboard.writeText(link);
      return link;
    } catch (err) {
      this.L.error({ err });
      throw err;
    }
  }

  async showResponse(resp: string) {
    //do not show this message if resp is empty string or is only a url. Url check ids added for github publish pod.
    if (
      resp.trim() &&
      !resp.match(
        "^(http://www.|https://www.|http://|https://)?[a-z0-9]+([-.]{1}[a-z0-9]+)*.[a-z]{2,5}(:[0-9]{1,5})?(/.*)?$"
      )
    )
      window.showInformationMessage("contents copied to clipboard");
  }

  addAnalyticsPayload(opts?: CommandOpts) {
    return PodUtils.getAnalyticsPayload(opts);
  }
}
