import {
  getAllImportPods,
  ImportPod,
  podClassEntryToPodItemV4,
  PodClassEntryV4,
  PodItemV4,
  PodUtils,
} from "@dendronhq/pods-core";
import { ProgressLocation, Uri, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { showPodQuickPickItemsV4 } from "../utils/pods";
import { DendronWorkspace, getWS } from "../workspace";
import { BaseCommand } from "./base";
import { ReloadIndexCommand } from "./ReloadIndex";

type CommandOutput = void;

type CommandInput = { podChoice: PodItemV4 };

type CommandOpts = CommandInput & { config: any };

export class ImportPodCommand extends BaseCommand<CommandOpts, CommandOutput> {
  public pods: PodClassEntryV4[];
  static key = DENDRON_COMMANDS.IMPORT_POD.key;

  constructor(_name?: string) {
    super(_name);
    this.pods = getAllImportPods();
  }

  async gatherInputs(): Promise<CommandInput | undefined> {
    const pods = getAllImportPods();
    const podItems: PodItemV4[] = pods.map((p) => podClassEntryToPodItemV4(p));
    const podChoice = await showPodQuickPickItemsV4(podItems);
    if (!podChoice) {
      return;
    }
    return { podChoice };
  }

  async enrichInputs(inputs: CommandInput): Promise<CommandOpts | undefined> {
    const podChoice = inputs.podChoice;
    const podClass = podChoice.podClass;
    const podsDir = DendronWorkspace.instance().podsDir;
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
    const ctx = { ctx: "ImportPod" };
    this.L.info({ ctx, opts });
    const wsRoot = DendronWorkspace.wsRoot();
    if (!wsRoot) {
      throw Error("ws root not defined");
    }
    const engine = DendronWorkspace.instance().getEngine();
    const vaults = DendronWorkspace.instance().vaultsv4;
    const pod = new opts.podChoice.podClass() as ImportPod;
    const vaultWatcher = getWS().vaultWatcher;
    if (vaultWatcher) {
      vaultWatcher.pause = true;
    }
    await window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "importing",
        cancellable: false,
      },
      async () => {
        await pod.execute({ config: opts.config, engine, wsRoot, vaults });
      }
    );
    await new ReloadIndexCommand().execute();
    if (vaultWatcher) {
      vaultWatcher.pause = false;
    }
    window.showInformationMessage(`done importing.`);
  }
}
