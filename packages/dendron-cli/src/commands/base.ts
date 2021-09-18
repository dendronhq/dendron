import { DendronError, isDendronResp } from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import { WorkspaceUtils } from "@dendronhq/engine-server";
import _ from "lodash";
import yargs from "yargs";

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

  /**
   * Converts CLI flags into {@link TOpts}
   * @param args
   */
  abstract enrichArgs(args: any): Promise<TOpts>;

  eval = async (args: any) => {
    this.L.info({ args });
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
