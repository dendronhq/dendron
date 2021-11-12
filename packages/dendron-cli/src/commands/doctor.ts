import { NoteProps } from "@dendronhq/common-all";
import { DoctorService, DoctorActions } from "@dendronhq/engine-server";
// @ts-ignore
import _ from "lodash";
import yargs from "yargs";
import { CLICommand, CommandCommonProps } from "./base";
import {
  setupEngine,
  setupEngineArgs,
  SetupEngineCLIOpts,
  SetupEngineOpts,
} from "./utils";

type CommandCLIOpts = {
  action: DoctorActions;
  query?: string;
  /**
   * pass in note candidates directly to
   * limit what notes should be used in the command.
   */
  candidates?: NoteProps[];
  limit?: number;
  dryRun?: boolean;
  /**
   * When set to true, calls process.exit when command is done.
   *
   * This is done for CLI commands to keep the server from running
   * forever. when run from the plugin, we re-use the existing server
   * so we don't want it to exit.
   */
  exit?: boolean;
} & SetupEngineCLIOpts;

type CommandOpts = CommandCLIOpts & SetupEngineOpts & CommandCommonProps;
type CommandOutput = CommandCommonProps;

export { CommandOpts as DoctorCLICommandOpts };
export class DoctorCLICommand extends CLICommand<CommandOpts, CommandOutput> {
  constructor() {
    super({ name: "doctor", desc: "doctor helps you fix your notes" });
  }

  buildArgs(args: yargs.Argv) {
    super.buildArgs(args);
    setupEngineArgs(args);
    args.option("action", {
      describe: "what action the doctor should take",
      type: "string",
      requiresArg: true,
      choices: Object.values(DoctorActions),
      // default: DoctorActions.FIX_FM
    });
    args.option("query", {
      describe: "run doctor over a query",
      type: "string",
    });
    args.option("limit", {
      describe: "limit num changes",
      type: "number",
    });
    args.option("dryRun", {
      describe: "dry run",
      type: "boolean",
    });
  }

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    this.addArgsToPayload({ action: args.action });
    const engineArgs = await setupEngine(args);
    return { data: { ...args, ...engineArgs } };
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const ds = new DoctorService();
    return ds.executeDoctorActions(opts);
  }
}
