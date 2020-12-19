import { DEngineClientV2 } from "@dendronhq/common-all";
import { goUpTo } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import yargs from "yargs";
import { LaunchEngineServerCommand } from "./launchEngineServer";
import { SoilCommandV3 } from "./soil";

// type CommandCLIOpts = SoilCommandCLIOpts & {
//   dryRun?: boolean;
// };
type CommandCLIOpts = {
  wsRoot: string;
  port?: number;
  engine?: DEngineClientV2;
  cwd?: string;
  serve: boolean;
  stage: "dev" | "prod";
};
type CommandOpts = CommandCLIOpts & { engine: DEngineClientV2 };
type CommandOutput = {};

export { CommandCLIOpts as BuildSiteV2CommandCLIOpts };

export class BuildSiteCommandV2 extends SoilCommandV3<
  CommandCLIOpts,
  CommandOpts,
  CommandOutput
> {
  buildArgs(args: yargs.Argv) {
    super.buildArgs(args);
    args.option("serve", {
      describe: "serve over local http server",
      default: false,
      type: "boolean",
    });
    args.option("stage", {
      describe: "serve over local http server",
      default: "dev",
      choices: ["dev", "prod"],
    });
  }

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    let { wsRoot, engine, port, serve, stage } = args;

    if (engine) {
      return {
        ...args,
        engine,
        wsRoot,
        port: port!,
        serve,
        stage,
      };
    } else {
      const launchEngineOpts = await new LaunchEngineServerCommand().enrichArgs(
        args
      );
      return {
        ...launchEngineOpts,
        serve,
        stage,
      } as CommandOpts;
    }
  }

  static buildCmd(yargs: yargs.Argv): yargs.Argv {
    const _cmd = new BuildSiteCommandV2();
    return yargs.command(
      "buildSiteV2",
      "build notes for publication using 11ty",
      _cmd.buildArgs,
      _cmd.eval
    );
  }

  async execute(opts: CommandOpts) {
    let { wsRoot, port, stage, cwd } = _.defaults(opts, {
      cwd: path.join(
        goUpTo(__dirname, "node_modules"),
        "node_modules",
        "@dendronhq",
        "dendron-11ty"
      ),
    });
    process.env["ENGINE_PORT"] = _.toString(port);
    process.env["WS_ROOT"] = wsRoot;
    process.env["STAGE"] = stage;
    const { compile } = require("@dendronhq/dendron-11ty");
    await compile({ cwd }, { serve: opts.serve });
    return {};
  }
}
