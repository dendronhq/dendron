import { ConfigFileUtils } from "@dendronhq/pods-core";
import path from "path";
import { Uri } from "vscode";
import { PodUIControls } from "../../components/pods/PodControls";
import { DENDRON_COMMANDS } from "../../constants";
import { VSCodeUtils } from "../../vsCodeUtils";
import { getExtension } from "../../workspace";
import { BasicCommand } from "../base";

type CommandOutput = void;

type CommandOpts = {};

export class ConfigureExportPodV2 extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CONFIGURE_EXPORT_POD_V2.key;

  async execute() {
    const ctx = { ctx: "ConfigureExportPodV2" };
    this.L.info({ ctx, msg: "enter" });
    const podsDir = path.join(getExtension().podsDir, "custom");
    let configFilePath: string;
    const exportChoice = await PodUIControls.promptForExportConfigOrNewExport();
    if (exportChoice === undefined) {
      return;
    } else if (exportChoice === "New Export") {
      const podType = await PodUIControls.promptForPodType();
      if (!podType) {
        return;
      }
      const id = await PodUIControls.promptForGenericId();
      if (!id) return;
      configFilePath = ConfigFileUtils.genConfigFileV2({
        fPath: path.join(getExtension().podsDir, "custom", `config.${id}.yml`),
        configSchema: ConfigFileUtils.getConfigSchema(podType),
        setProperties: { podId: id, podType },
      });
    } else {
      configFilePath = path.join(podsDir, `config.${exportChoice.podId}.yml`);
    }
    await VSCodeUtils.openFileInEditor(Uri.file(configFilePath));
  }
}
