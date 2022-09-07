import { NoteProps } from "@dendronhq/common-all";
import { DoctorService, DoctorActionsEnum } from "@dendronhq/engine-server";
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
  action: DoctorActionsEnum;
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
  /**
   * pod Id used to export Note(s) to Airtable
   */
  podId?: string;
} & SetupEngineCLIOpts;

type CommandOpts = CommandCLIOpts & SetupEngineOpts & CommandCommonProps;
type CommandOutput = { resp?: any } & CommandCommonProps;

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
      choices: Object.values(DoctorActionsEnum),
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
    args.option("podId", {
      describe: "podId used to export note(s) to Airtable",
      type: "string",
    });
  }

  async enrichArgs(args: CommandCLIOpts) {
    this.addArgsToPayload({ action: args.action });
    const engineArgs = await setupEngine(args);
    return { data: { ...args, ...engineArgs } };
  }

  /**
   * Given opts and out,
   * prepare the analytics payload that should be included to the
   * tracked event.
   *
   * Implement {@link DoctorService.executeDoctorActions} so that
   * it outputs the necessary information,
   * and prepare / add it here.
   *
   * Only the cases implemented will add a payload.
   */
  async addAnalyticsPayload(opts: CommandOpts, out: CommandOutput) {
    switch (opts.action) {
      case DoctorActionsEnum.FIX_INVALID_FILENAMES: {
        const payload = out.resp;
        if (payload) {
          _.entries(payload).forEach((entry) => {
            const [key, value] = entry;
            this.addToPayload({ key, value });
          });
        }
        break;
      }
      default: {
        // no-op.
        break;
      }
    }
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const ds = new DoctorService({ printFunc: this.print.bind(this) });
    const out = await ds.executeDoctorActions(opts);
    await this.addAnalyticsPayload(opts, out);
    ds.dispose();
    return out;
  }
}
