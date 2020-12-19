import { DEngineClientV2 } from "@dendronhq/common-all";
import { goUpTo } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import yargs from "yargs";
import { LaunchEngineServerCommand } from "./launchEngineServer";
import { SoilCommandCLIOptsV3, SoilCommandOptsV3, SoilCommandV3 } from "./soil";
const { compile } = require("@dendronhq/dendron-11ty");

// type CommandCLIOpts = SoilCommandCLIOpts & {
//   dryRun?: boolean;
// };
export type CommandCLIOpts = SoilCommandCLIOptsV3 & {
  port?: number;
  engine?: DEngineClientV2;
  serve: boolean;
  stage: "dev" | "prod";
};
type CommandOpts = SoilCommandOptsV3 & Required<CommandCLIOpts>;
type CommandOutput = {};

export { CommandCLIOpts as BuildSiteCommandCLIOpts };

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
    console.log("bond0");

    if (engine) {
      return {
        ...args,
        engine,
        wsRoot,
        vaults: engine.vaults,
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
    let { wsRoot, port, stage } = _.defaults(opts);
    const ctx = "BuildSiteV2";
    const cwd = path.join(
      goUpTo(__dirname, "node_modules"),
      "node_modules",
      "@dendronhq",
      "dendron-11ty"
    );
    // const cwd = path.join(
    //   __dirname,
    //   "..",
    //   "..",
    //   "..",
    //   "node_modules/@dendronhq/dendron-11ty"
    // );
    console.log("bond1", cwd);
    console.log({ ctx, wsRoot, port, stage, cwd });
    process.env["ENGINE_PORT"] = _.toString(port);
    process.env["WS_ROOT"] = wsRoot;
    process.env["STAGE"] = stage;
    await compile({ cwd }, { serve: opts.serve, input: "." });
    console.log("done with build site");
    return {};
  }
}
