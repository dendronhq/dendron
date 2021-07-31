import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import { GraphStyleService } from "../styles";

type CommandOpts = {};

type CommandOutput = void;

export class ConfigureGraphStylesCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.CONFIGURE_GRAPH_STYLES.key;
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute() {
    if (!GraphStyleService.doesStyleFileExist()) {
      GraphStyleService.createStyleFile()
    }
    await GraphStyleService.openStyleFile()
  }
}
