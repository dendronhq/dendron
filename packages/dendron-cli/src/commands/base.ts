import { DendronError, isDendronResp, CLIEvents } from "@dendronhq/common-all";
import { createLogger, SegmentClient, TelemetryStatus } from "@dendronhq/common-server";
import { WorkspaceUtils } from "@dendronhq/engine-server";
import _ from "lodash";
import yargs from "yargs";
import { CLIAnalyticsUtils } from "../utils/analytics";

type BaseCommandOpts = { quiet?: boolean };

export type CommandCommonProps = {
  error?: DendronError;
};

export abstract class BaseCommand<
  /**
   * These are options that are passed to `command.execute`
   */
  TOpts extends CommandCommonProps = CommandCommonProps,
  /**
   * This is the output returned by `command.execute`
   */
  TOut extends CommandCommonProps = CommandCommonProps
> {
  public L: ReturnType<typeof createLogger>;
  public opts: BaseCommandOpts;

  constructor(name?: string, opts?: BaseCommandOpts) {
    this.opts = opts || {};
    this.L = createLogger(name || "Command");
  }
  abstract execute(opts?: TOpts): Promise<TOut>;
}

export abstract class CLICommand<
  TOpts extends CommandCommonProps = CommandCommonProps,
  TOut extends CommandCommonProps = CommandCommonProps
> extends BaseCommand<TOpts, TOut> {
  public name: string;
  public desc: string;
  // TODO: hackish
  protected wsRootOptional?: boolean;

  constructor(opts: { name: string; desc: string } & BaseCommandOpts) {
    super(opts.name, opts);
    this.name = opts.name;
    this.desc = opts.desc;
  }

  buildArgs(args: yargs.Argv) {
    args.option("wsRoot", {
      describe: "location of workspace",
    });
    args.option("vault", {
      describe: "name of vault",
    });
    args.option("quiet", {
      describe: "don't print output to stdout",
    });
  }

  buildCmd(yargs: yargs.Argv): yargs.Argv {
    return yargs.command(this.name, this.desc, this.buildArgs, this.eval);
  }

  setUpSegmentClient() {
    // if running CLI without ever having used dendron plugin, 
    // show a notice about telemety and instructions on how to disable.
    if (_.isUndefined(SegmentClient.readConfig())) {
      CLIAnalyticsUtils.showTelemetryMessage();
      const reason = TelemetryStatus.ENABLED_BY_CLI_DEFAULT;
      SegmentClient.enable(reason);
      CLIAnalyticsUtils.track(CLIEvents.CLITelemetryEnabled, { reason });
    }

    const segment = SegmentClient.instance({ forceNew: true, });
    this.L.info({ msg: `Telemetry is disabled? ${ segment.hasOptedOut }`});
  }

  /**
   * Converts CLI flags into {@link TOpts}
   * @param args
   */
  abstract enrichArgs(args: any): Promise<TOpts>;

  eval = async (args: any) => {
    this.L.info({ args });
    this.setUpSegmentClient();
    if (!args.wsRoot) {
      const configPath = WorkspaceUtils.findWSRoot();
      if (_.isUndefined(configPath) && !this.wsRootOptional) {
        console.log("no workspace detected. --wsRoot must be set");
        process.exit(1);
      } else {
        args.wsRoot = configPath;
      }
    }
    if (args.quiet) {
      this.opts.quiet = true;
    }
    const opts = await this.enrichArgs(args);
    if (opts.error) {
      this.L.error(opts.error);
      return { error: opts.error };
    }
    const out = await this.execute(opts);
    if (isDendronResp(out) && out.error) {
      this.L.error(out.error);
    }
    return out;
  };

  print(obj: any) {
    if (!this.opts.quiet) {
      console.log(obj);
    }
  }
}
