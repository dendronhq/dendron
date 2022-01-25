import { ExternalConnectionManager } from "@dendronhq/pods-core";
import path from "path";
import { QuickPickItem, Uri, window } from "vscode";
import { PodUIControls } from "../../components/pods/PodControls";
import { DENDRON_COMMANDS } from "../../constants";
import { VSCodeUtils } from "../../vsCodeUtils";
import { getExtension } from "../../workspace";
import { BasicCommand } from "../base";

type CommandOutput = void;

type CommandOpts = {};

export class ConfigureServiceConnection extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CONFIGURE_SERVICE_CONNECTION.key;

  async execute(_opts: CommandOpts) {
    const ctx = { ctx: "ConfigureServiceConnection" };
    this.L.info({ ctx, msg: "enter" });
    let configFilePath: string;
    const mngr = new ExternalConnectionManager(getExtension().podsDir);
    const allServiceConfigs = await mngr.getAllValidConfigs();
    const items = allServiceConfigs.map<QuickPickItem>((value) => {
      return { label: value.connectionId, description: value.serviceType };
    });
    const createNewServiceLabel = { label: "Create New Service Connection" };
    const userChoice = await window.showQuickPick(
      items.concat(createNewServiceLabel),
      {
        title: "Pick the Service Connection Configuration or Create a New One",
        ignoreFocusOut: true,
      }
    );
    if (!userChoice) return;
    if (userChoice.label === createNewServiceLabel.label) {
      const serviceType = await PodUIControls.promptForExternalServiceType();
      if (!serviceType) return;
      await PodUIControls.createNewServiceConfig(serviceType);
    } else {
      const configRoothPath = mngr.configRootPath;
      configFilePath = path.join(
        configRoothPath,
        `svcconfig.${userChoice.label}.yml`
      );
      await VSCodeUtils.openFileInEditor(Uri.file(configFilePath));
    }
  }
}
