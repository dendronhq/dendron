import { launch } from "@dendronhq/api-server";
import { resolvePath } from "@dendronhq/common-server";
import {
  DendronEngineClient,
  WorkspaceService,
} from "@dendronhq/engine-server";
import _ from "lodash";
import yargs from "yargs";
import { SoilCommandCLIOptsV3, SoilCommandOptsV3, SoilCommandV3 } from "./soil";

type CommandOutput = { port: number };
type CommandOpts = SoilCommandOptsV3 & Required<CommandCLIOpts>;
export type CommandCLIOpts = SoilCommandCLIOptsV3 & {
  port?: number;
};

export class LaunchEngineServerCommand extends SoilCommandV3<
  CommandCLIOpts,
  CommandOpts,
  CommandOutput
> {
  static buildCmd(yargs: yargs.Argv): yargs.Argv {
    const _cmd = new LaunchEngineServerCommand();
    return yargs.command(
      "launchEngineServer",
      "port to launch from",
      _cmd.buildArgs,
      _cmd.eval
    );
  }

  buildArgs(args: yargs.Argv) {
    super.buildArgs(args);
    args.option("port", {
      describe: "port to launch server",
      type: "number",
    });
  }

  async enrichArgs(args: CommandCLIOpts) {
    let { wsRoot, port } = args;
    const cwd = process.cwd();
    wsRoot = resolvePath(wsRoot, cwd);
    const ws = new WorkspaceService({ wsRoot });
    const vaults = ws.config.vaults;
    const vaultPaths = vaults.map((v) => resolvePath(v.fsPath, wsRoot));
    const _port = await launch({ port, logPath: process.env["LOG_DST"] });
    ws.writeMeta({ version: "dendron-cli" });
    ws.writePort(_port);
    const engine = DendronEngineClient.create({
      port: _port,
      vaults: vaultPaths,
      ws: wsRoot,
    });
    return {
      ...args,
      engine,
      wsRoot,
      vaults: vaultPaths,
      port: _port,
    };
  }

  async execute(opts: CommandOpts) {
    const { port } = opts;
    console.log(`engine runnig on port ${port}`);

    return {
      port: _.toInteger(port),
    };
  }
}
