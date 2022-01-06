import {
  ConfigFileUtils,
  PodV2ConfigManager,
  PodV2Types,
} from "@dendronhq/pods-core";
import path from "path";
import { QuickPickItem, Uri, window } from "vscode";
import { PodUIControls } from "../../components/pods/PodControls";
import { DENDRON_COMMANDS } from "../../constants";
import { VSCodeUtils } from "../../vsCodeUtils";
import { getExtension } from "../../workspace";
import { BasicCommand } from "../base";

type CommandOutput = void;

type CommandInput = { podType: PodV2Types };

type CommandOpts = CommandInput;

export class ConfigureExportPodV2 extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CONFIGURE_EXPORT_POD_V2.key;

  async gatherInputs(): Promise<CommandInput | undefined> {
    const podType = await PodUIControls.promptForPodType();
    if (!podType) return;
    return {
      podType,
    };
  }

  async execute(opts: CommandOpts) {
    const ctx = { ctx: "ConfigureExportPodV2" };
    const { podType } = opts;
    this.L.info({ ctx, podType, msg: "enter" });
    const podsDir = path.join(getExtension().podsDir, "custom");
    let configFilePath: string;
    const existingConfigs = await PodV2ConfigManager.getAllConfigsByType({
      type: podType,
      podsDir,
    });
    if (existingConfigs.length > 0) {
      const items = existingConfigs.map<QuickPickItem>((value) => {
        return { label: value.podId };
      });
      const userChoice = await window.showQuickPick(items, {
        title: "Pick the pod config",
        ignoreFocusOut: true,
      });
      if (!userChoice) return;
      configFilePath = path.join(podsDir, `config.${userChoice.label}.yml`);
    } else {
      const id = await PodUIControls.promptForGenericId();
      if (!id) return;
      configFilePath = ConfigFileUtils.genConfigFileV2({
        fPath: path.join(getExtension().podsDir, "custom", `config.${id}.yml`),
        configSchema: ConfigFileUtils.getConfigSchema(podType),
        setProperties: { podId: id, podType },
      });
    }
    await VSCodeUtils.openFileInEditor(Uri.file(configFilePath));
  }
}
