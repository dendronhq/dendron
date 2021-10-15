import { DVault } from "@dendronhq/common-all";
import { launchv2 } from "@dendronhq/api-server";
import { LogLvl, resolvePath } from "@dendronhq/common-server";
import {
  DendronEngineClient,
  WorkspaceService,
  DConfig,
} from "@dendronhq/engine-server";
import _ from "lodash";
import { Socket } from "net";
import yargs from "yargs";
import { CLICommand, CommandCommonProps } from "./base";

type CommandOutput = { port: number; server: any } & CommandCommonProps;
type CommandOpts = Required<Omit<CommandCLIOpts, keyof CommandCLIOnlyOpts>> & {
  server: any;
  serverSockets?: Set<Socket>;
} & CommandCommonProps;
type CommandCLIOnlyOpts = {
  /**
   *
   * Whether Dendron should write the port to the * {@link file | https://wiki.dendron.so/notes/446723ba-c310-4302-a651-df14ce6e002b.html#dendron-port-file }
   */
  noWritePort?: boolean;
};
type CommandCLIOpts = {
  port?: number;
  init?: boolean;
  wsRoot: string;
} & CommandCLIOnlyOpts;

export { CommandCLIOpts as LaunchEngineServerCLIOpts };

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
    args.option("init", {
      describe: "initialize server",
      type: "boolean",
    });
    args.option("noWritePort", {
      describe: "don't write the port to a file",
      type: "boolean",
    });
  }

  async enrichArgs(args: CommandCLIOpts) {
    const ctx = "enrichArgs";
    let { wsRoot, port, init, noWritePort } = _.defaults(args, {
      init: false,
      noWritePort: false,
    });
    wsRoot = resolvePath(wsRoot, process.cwd());
    const ws = new WorkspaceService({ wsRoot });
    const { dev } = ws.config;
    const vaults = DConfig.getConfig({
      config: ws.config,
      path: "workspace.vaults",
      required: true,
    }) as DVault[];
    const vaultPaths = vaults.map((v) => resolvePath(v.fsPath, wsRoot));
    const {
      port: _port,
      server,
      serverSockets,
    } = await launchv2({
      port,
      logPath: process.env["LOG_DST"],
      logLevel: (process.env["LOG_LEVEL"] as LogLvl) || "error",
      nextServerUrl: dev?.nextServerUrl,
      nextStaticRoot: dev?.nextStaticRoot,
    });
    ws.writeMeta({ version: "dendron-cli" });

    if (!noWritePort) {
      ws.writePort(_port);
    }
    const engine = DendronEngineClient.create({
      port: _port,
      vaults,
      ws: wsRoot,
    });
    if (init) {
      this.L.info({ ctx, msg: "pre:engine.init" });
      await engine.init();
    }
    return {
      ...args,
      engine,
      wsRoot,
      init,
      vaults: vaultPaths,
      port: _port,
      server,
      serverSockets,
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
