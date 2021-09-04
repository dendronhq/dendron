import { DConfig } from "@dendronhq/engine-server";
import { Uri } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { getDWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandOutput = void;

export class ConfigureCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.CONFIGURE_RAW.key;
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute() {
    const dendronRoot = getDWorkspace().wsRoot;
    const configPath = DConfig.configPath(dendronRoot);
    const uri = Uri.file(configPath);
    await VSCodeUtils.openFileInEditor(uri);
    return;
  }
}
