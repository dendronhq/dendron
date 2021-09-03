import { DENDRON_COMMANDS } from "../constants";
import { WSUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandInput = {};

type CommandOutput = void;

export class LaunchTutorialCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.LAUNCH_TUTORIAL.key;

  async gatherInputs(): Promise<CommandInput | undefined> {
    return {};
  }

  async execute(_opts: CommandOpts): Promise<CommandOutput> {
    const assetUri = WSUtils.getAssetUri(DendronWorkspace.context());
    await WSUtils.showWelcome(assetUri);
  }
}
