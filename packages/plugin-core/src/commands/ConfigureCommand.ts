import { ConfigService } from "@dendronhq/common-all";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandOutput = void;

export class ConfigureCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.CONFIGURE_RAW.key;
  public static requireActiveWorkspace: boolean = true;

  constructor() {
    super();
  }

  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute() {
    const configPath = ConfigService.instance().configPath;
    await VSCodeUtils.openFileInEditor(configPath);
    return;
  }
}
