import {
  CLIEvents,
  DendronError,
  isDendronResp,
  RespV3,
  config,
  RuntimeUtils,
} from "@dendronhq/common-all";
import {
  createLogger,
  getDurationMilliseconds,
  SegmentClient,
  TelemetryStatus,
} from "@dendronhq/common-server";
import { WorkspaceUtils } from "@dendronhq/engine-server";
import _ from "lodash";
import yargs from "yargs";
import { CLIAnalyticsUtils } from "../utils/analytics";

type BaseCommandOpts = { quiet?: boolean; dev?: boolean };

export type CommandCommonProps = {
  error?: DendronError;
  exit?: boolean;
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
  protected _analyticsPayload: any = {};

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
    args.option("devMode", {
      describe: "set stage to dev",
      type: "boolean",
      default: false,
    });
    args.hide("devMode");
  }

  buildCmd(yargs: yargs.Argv): yargs.Argv {
    return yargs.command(this.name, this.desc, this.buildArgs, this.eval);
  }

  setUpSegmentClient() {
    if (RuntimeUtils.isRunningInTestOrCI()) {
      return;
    }
    // if running CLI without ever having used dendron plugin,
    // show a notice about telemety and instructions on how to disable.
    if (_.isUndefined(SegmentClient.readConfig())) {
      CLIAnalyticsUtils.showTelemetryMessage();
      const reason = TelemetryStatus.ENABLED_BY_CLI_DEFAULT;
      SegmentClient.enable(reason);
      CLIAnalyticsUtils.track(CLIEvents.CLITelemetryEnabled, { reason });
    }
    const stage = this.opts.dev ? config.dev : config.prod;
    const segment = SegmentClient.instance({
      forceNew: true,
      key: stage.SEGMENT_VSCODE_KEY,
    });
    this.L.info({ msg: `Telemetry is disabled? ${segment.hasOptedOut}` });
  }

  addArgsToPayload(data: any) {
    _.set(this._analyticsPayload, "args", data);
  }

  /**
   * Converts CLI flags into {@link TOpts}
   * @param args
   */
  abstract enrichArgs(args: any): Promise<RespV3<TOpts>>;

  eval = async (args: any) => {
    const start = process.hrtime();
    this.L.info({ args, state: "enter" });
    if (args.devMode) {
      this.opts.dev = args.devMode;
    }
    this.L.info({ args, state: "setUpSegmentClient:pre" });
    this.setUpSegmentClient();

    this.L.info({ args, state: "findWSRoot:pre" });
    if (!args.wsRoot) {
      const configPath = WorkspaceUtils.findWSRoot();
      if (_.isUndefined(configPath) && !this.wsRootOptional) {
        // eslint-disable-next-line no-console
        console.log("no workspace detected. --wsRoot must be set");
        process.exit(1);
      } else {
        args.wsRoot = configPath;
      }
    }
    if (args.quiet) {
      this.opts.quiet = true;
    }
    this.L.info({ args, state: "enrichArgs:pre" });
    const opts = await this.enrichArgs(args);
    if (opts.error) {
      this.L.error(opts.error);
      return { error: opts.error };
    }

    this.L.info({ args, state: "execute:pre" });
    const out = await this.execute(opts.data);
    this.L.info({ args, state: "execute:post" });
    if (isDendronResp(out) && out.error) {
      this.L.error(out.error);
    }

    const analyticsPayload = this._analyticsPayload || {};
    const event = this.constructor.name;
    const props = {
      duration: getDurationMilliseconds(start),
      ...analyticsPayload,
    };

    CLIAnalyticsUtils.identify();

    if (out.exit) {
      this.L.info({ args, state: "processExit:pre" });
      await CLIAnalyticsUtils.trackSync(event, props);
      process.exit();
    }

    CLIAnalyticsUtils.track(event, props);

    this.L.info({ args, state: "exit" });
    return out;
  };

  print(obj: any) {
    if (!this.opts.quiet) {
      // eslint-disable-next-line no-console
      console.log(obj);
    }
  }
}
