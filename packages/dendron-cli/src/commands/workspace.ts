import { DendronError } from "@dendronhq/common-all";
import { WorkspaceService } from "@dendronhq/engine-server";
import _ from "lodash";
import yargs from "yargs";
import { CLICommand, CommandCommonProps } from "./base";
import { setupEngine } from "./utils";

type CommandCLIOpts = {
  wsRoot: string;
  fromConfig?: boolean;
  dryRun?: boolean;
  action: Action;
  useGithubAccessToken?: boolean;
};

type CommandOpts = CommandCLIOpts & CommandCommonProps;

export enum Action {
  INIT = "init",
}

export class WorkspaceCLICommand extends CLICommand<CommandOpts> {
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
    this.addArgsToPayload({ action: args.action });
    const engineArgs = await setupEngine({ ...args, init: false });
    return { ...args, ...engineArgs };
  }
  async execute(opts: CommandOpts) {
    const { action, fromConfig, wsRoot } = _.defaults(opts, {});
    switch (action) {
      case Action.INIT: {
        if (fromConfig) {
          await WorkspaceService.createFromConfig({ wsRoot });
          return {};
        } else {
          throw Error("this command is not supported yet");
        }
      }
      default: {
        throw new DendronError({ message: `unsupported action: ${action}` });
      }
    }
  }
}
