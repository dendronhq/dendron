import { createLogger } from "@dendronhq/common-server";
import yargs from "yargs";
import _ from "lodash";

type BaseCommandOpts = { log2Stdout?: boolean };

export abstract class BaseCommand<TOpts, TOut = any> {
  public L: ReturnType<typeof createLogger>;

  constructor(name?: string, opts?: BaseCommandOpts) {
    opts = _.defaults(opts, { log2Stdout: false });
    this.L = createLogger(name || "Command");
  }
  abstract execute(opts?: TOpts): Promise<TOut>;
}

export abstract class CLICommand<TOpts, TOut> extends BaseCommand<TOpts, TOut> {
  public name: string;
  public desc: string;

  constructor(opts: { name: string; desc: string } & BaseCommandOpts) {
    super(opts.name, opts);
    this.name = opts.name;
    this.desc = opts.desc;
  }

  buildArgs(args: yargs.Argv) {
    args.option("wsRoot", {
      describe: "location of workspace",
      demandOption: true,
    });
  }

  buildCmd(yargs: yargs.Argv): yargs.Argv {
    return yargs.command(this.name, this.desc, this.buildArgs, this.eval);
  }

  abstract enrichArgs(args: any): Promise<TOpts>;

  eval = async (args: any) => {
    this.L.info({ args });
    const opts = await this.enrichArgs(args);
    return this.execute(opts);
  };
}
