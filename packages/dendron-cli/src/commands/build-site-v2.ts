import { DEngineClientV2 } from "@dendronhq/common-all";
import { goUpTo, resolvePath } from "@dendronhq/common-server";
import { EngineConnector } from "@dendronhq/engine-server";
import fs from "fs-extra";
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
  servePort?: number;
  enginePort?: number;
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
    args.option("servePort", {
      describe: "port to serve over",
      default: "8080",
    });
    args.option("enginePort", {
      describe: "port that engine is running on",
    });
  }

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    let { wsRoot, enginePort, port, serve, stage, servePort } = args;
    wsRoot = resolvePath(wsRoot, process.cwd());

    if (enginePort) {
      const engineConnector = EngineConnector.getOrCreate({
        wsRoot,
      });
      console.log("connect to existing engine", enginePort);
      await engineConnector.init({ portOverride: enginePort });
      return {
        ...args,
        engine: engineConnector.engine,
        wsRoot,
        port: port!,
        serve,
        stage,
        servePort,
      };
    } else {
      const launchEngineOpts = await new LaunchEngineServerCommand().enrichArgs(
        args
      );
      return {
        ...launchEngineOpts,
        serve,
        stage,
        servePort,
        wsRoot,
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
    let nmPath = goUpTo(__dirname, "node_modules");
    let cwd = path.join(nmPath, "node_modules", "@dendronhq", "dendron-11ty");
    // fix for /home/runner/work/dendron-site/dendron-site/node_modules/@dendronhq/dendron-cli/node_modules/@dendronhq/dendron-11ty'
    if (!fs.existsSync(cwd)) {
      nmPath = goUpTo(path.join(nmPath, ".."), "node_modules");
      cwd = path.join(nmPath, "node_modules", "@dendronhq", "dendron-11ty");
    }
    let { wsRoot, port, stage, servePort } = _.defaults(opts, {});
    cwd = opts.cwd || cwd;
    process.env["ENGINE_PORT"] = _.toString(port);
    process.env["WS_ROOT"] = wsRoot;
    process.env["STAGE"] = stage;
    process.env["ELEV_PORT"] = _.toString(servePort);
    const { compile } = require("@dendronhq/dendron-11ty");
    await compile({ cwd }, { serve: opts.serve, port: servePort });
    if (!opts.serve) {
      process.exit();
    }
    return {};
  }
}
