import { DendronError } from "@dendronhq/common-all";
import { resolvePath } from "@dendronhq/common-server";
import { WorkspaceService } from "@dendronhq/engine-server";
import _ from "lodash";
import yargs from "yargs";
import { CLICommand } from "./base";
import { CommandOptsV3 } from "./soil";
import { setupEngine } from "./utils";

type CommandCLIOpts = {
  wsRoot: string;
  fromConfig?: boolean;
  dryRun?: boolean;
  action: Action;
};

type CommandOpts = CommandOptsV3 & CommandCLIOpts;
type CommandOutput = void;

export enum Action {
  INIT = "init",
}

export class WorkspaceCLICommand extends CLICommand<
  CommandOpts,
  CommandOutput
> {
  constructor() {
    super({ name: "workspace", desc: "workspace related methods" });
  }

  buildArgs(args: yargs.Argv) {
    super.buildArgs(args);
    args.option("action", {
      describe: "what action to execute",
      requiresArg: true,
      choices: Object.values(Action),
    });
    args.option("fromConfig", {
      describe: "initialize from dendron.yml",
      type: "boolean",
    });
  }

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    const engineArgs = await setupEngine({ ...args, init: false });
    return { ...args, ...engineArgs };
  }
  async execute(opts: CommandOpts) {
    const { action, fromConfig, wsRoot } = _.defaults(opts, {});
    switch (action) {
      case Action.INIT: {
        if (fromConfig) {
          await WorkspaceService.createFromConfig(wsRoot);
          process.exit();
        } else {
          throw Error("this command is not supported yet");
        }
      }
      default: {
        throw new DendronError({ msg: `unsupported action: ${action}` });
      }
    }
  }
}
