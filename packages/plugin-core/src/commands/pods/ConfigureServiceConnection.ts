import {
  ExternalConnectionManager,
  ExternalService,
} from "@dendronhq/pods-core";
import path from "path";
import { QuickPickItem, Uri, window } from "vscode";
import { PodUIControls } from "../../components/pods/PodControls";
import { DENDRON_COMMANDS } from "../../constants";
import { VSCodeUtils } from "../../vsCodeUtils";
import { getExtension } from "../../workspace";
import { BasicCommand } from "../base";

type CommandOutput = void;

type CommandInput = { serviceType: ExternalService };

type CommandOpts = CommandInput;

export class ConfigureServiceConnection extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CONFIGURE_SERVICE_CONNECTION.key;

  async gatherInputs(): Promise<CommandInput | undefined> {
    const serviceType = await PodUIControls.promptForExternalServiceType();
    if (!serviceType) return;
    return {
      serviceType,
    };
  }

  async execute(opts: CommandOpts) {
    const ctx = { ctx: "ConfigureServiceConnection" };
    this.L.info({ ctx, opts });
    const { serviceType } = opts;
    let configFilePath: string;
    const mngr = new ExternalConnectionManager(getExtension().podsDir);
    const existingConnections = await mngr.getAllConfigsByType(serviceType);
    if (existingConnections.length > 0) {
      const items = existingConnections.map<QuickPickItem>((value) => {
        return { label: value.connectionId };
      });
      const userChoice = await window.showQuickPick(items, {
        title: "Pick the service connection config",
        ignoreFocusOut: true,
      });
      if (!userChoice) return;
      const configRoothPath = mngr.configRootPath;
      configFilePath = path.join(
        configRoothPath,
        `svcconfig.${userChoice.label}.yml`
      );
    } else {
      const id = await PodUIControls.promptForGenericId();
      if (!id) return;
      configFilePath = await mngr.createNewConfig({ serviceType, id });
    }
    await VSCodeUtils.openFileInEditor(Uri.file(configFilePath));
  }
}
