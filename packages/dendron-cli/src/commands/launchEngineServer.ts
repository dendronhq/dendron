import { launchv2 } from "@dendronhq/api-server";
import { LogLvl, resolvePath } from "@dendronhq/common-server";
import {
  DendronEngineClient,
  WorkspaceService,
} from "@dendronhq/engine-server";
import _ from "lodash";
import yargs from "yargs";
import { CLICommand } from "./base";

type CommandOutput = { port: number; server: any };
type CommandOpts = Required<CommandCLIOpts> & { server: any };
type CommandCLIOpts = {
  port?: number;
  wsRoot: string;
};

export class LaunchEngineServerCommand extends CLICommand<
  CommandOpts,
  CommandOutput
> {
  constructor() {
    super({
      name: "launchEngineServer",
      desc: "launch instance of dendron engine",
    });
  }

  buildArgs(args: yargs.Argv<CommandCLIOpts>) {
    super.buildArgs(args);
    args.option("port", {
      describe: "port to launch server",
      type: "number",
    });
  }

  async enrichArgs(args: CommandCLIOpts) {
    let { wsRoot, port } = args;
    wsRoot = resolvePath(wsRoot, process.cwd());
    const ws = new WorkspaceService({ wsRoot });
    const vaults = ws.config.vaults;
    const vaultPaths = vaults.map((v) => resolvePath(v.fsPath, wsRoot));
    const { port: _port, server } = await launchv2({
      port,
      logPath: process.env["LOG_DST"],
      logLevel: (process.env["LOG_LEVEL"] as LogLvl) || "error",
    });
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
      server,
    };
  }

  async execute(opts: CommandOpts) {
    const { port, server } = opts;

    return {
      port: _.toInteger(port),
      server,
    };
  }
}
