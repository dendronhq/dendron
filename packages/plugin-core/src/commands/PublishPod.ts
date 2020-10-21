import clipboardy from "@dendronhq/clipboardy";
import { DNodeUtilsV2 } from "@dendronhq/common-all";
import { PublishPodCommandOpts } from "@dendronhq/dendron-cli";
import {
  genPodConfig,
  getAllPublishPods,
  getPodConfig,
  podClassEntryToPodItemV3,
  PodItemV3,
  PodUtils,
  PublishPodOpts,
} from "@dendronhq/pods-core";
import { Uri, window } from "vscode";
import { VSCodeUtils } from "../utils";
import { showPodQuickPickItemsV3 } from "../utils/pods";
import { DendronWorkspace } from "../workspace";
import { BaseCommand } from "./base";

type CommandOpts = PublishPodCommandOpts;

type CommandInput = { podChoice: PodItemV3 };

type CommandOutput = void;
export { CommandOpts as PublishPodCommandOpts };

export class PublishPodCommand extends BaseCommand<CommandOpts, CommandOutput> {
  async gatherInputs(): Promise<any> {
    const pods = getAllPublishPods();
    const podItems: PodItemV3[] = pods.map((p) => podClassEntryToPodItemV3(p));
    const podChoice = await showPodQuickPickItemsV3(podItems);
    if (!podChoice) {
      return;
    }
    return { podChoice };
  }

  async enrichInputs(inputs: CommandInput): Promise<CommandOpts | undefined> {
    const podChoice = inputs.podChoice;
    const podsDir = DendronWorkspace.instance().podsDir;
    const maybeConfig = getPodConfig(podsDir, podChoice.podClass);
    let noteByName = VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath;
    if (!noteByName) {
      window.showErrorMessage(
        "you must have a note open to execute this command"
      );
      return;
    }
    if (!DendronWorkspace.lsp()) {
      window.showErrorMessage(
        "server mode must be turned on to execute this command"
      );
      return;
    }
    noteByName = DNodeUtilsV2.fname(noteByName);

    if (!maybeConfig && PodUtils.hasRequiredOpts(podChoice.podClass)) {
      const configPath = genPodConfig(podsDir, podChoice.podClass);
      await VSCodeUtils.openFileInEditor(Uri.file(configPath));
      window.showInformationMessage(
        "Looks like this is your first time running this pod. Please fill out the configuration and then run this command again. "
      );
      return;
    }
    const podClass = podChoice.podClass;
    const engine = DendronWorkspace.instance().getEngine();
    const vault = engine.vaults[0];
    const wsRoot = DendronWorkspace.rootDir() as string;
    return { podClass, config: maybeConfig, noteByName, engine, wsRoot, vault };
  }

  async execute(opts: CommandOpts) {
    const { podClass, config, noteByName, engine, wsRoot, vault } = opts;

    const pod = new podClass({
      vaults: [vault],
      wsRoot,
      engine,
    });
    const link = await pod.plant({
      mode: "notes",
      config,
      fname: noteByName,
    } as PublishPodOpts);
    try {
      clipboardy.writeSync(link);
    } catch (err) {
      this.L.error({ err, link });
      throw err;
    }
    this.showResponse();
    return link;
  }

  async showResponse() {
    window.showInformationMessage("contents copied to clipboard");
  }
}
