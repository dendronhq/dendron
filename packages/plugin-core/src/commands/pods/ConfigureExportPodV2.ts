import { ConfigFileUtils, PodUtils } from "@dendronhq/pods-core";
import { Uri } from "vscode";
import { PodUIControls } from "../../components/pods/PodControls";
import { DENDRON_COMMANDS } from "../../constants";
import { ExtensionProvider } from "../../ExtensionProvider";
import { VSCodeUtils } from "../../vsCodeUtils";
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
    const { wsRoot } = ExtensionProvider.getDWorkspace();
    let configFilePath: string;
    const exportChoice = await PodUIControls.promptForExportConfigOrNewExport();
    if (exportChoice === undefined) {
      return;
    } else if (exportChoice === "New Export") {
      const podType = await PodUIControls.promptForPodType();
      if (!podType) {
        return;
      }
      const podId = await PodUIControls.promptForGenericId();
      if (!podId) return;
      configFilePath = ConfigFileUtils.genConfigFileV2({
        fPath: PodUtils.getCustomConfigPath({ wsRoot, podId }),
        configSchema: ConfigFileUtils.getConfigSchema(podType),
        setProperties: { podId, podType },
      });
    } else {
      configFilePath = PodUtils.getCustomConfigPath({
        wsRoot,
        podId: exportChoice.podId,
      });
    }
    await VSCodeUtils.openFileInEditor(Uri.file(configFilePath));
  }
}
