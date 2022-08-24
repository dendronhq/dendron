import { launchv2 } from "@dendronhq/api-server";
import { ConfigUtils } from "@dendronhq/common-all";
import { LogLvl, resolvePath } from "@dendronhq/common-server";
import {
  DendronEngineClient,
  EngineUtils,
  WorkspaceService,
} from "@dendronhq/engine-server";
import _ from "lodash";
import { Socket } from "net";
import yargs from "yargs";
import { CLIUtils } from "../utils/cli";
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
  /**
   * Fast boot mode for engine. Don't index
   */
  fast?: boolean;
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
    args.option("fast", {
      describe: "launch engine without indexing",
      type: "boolean",
    });
  }

  async enrichArgs(args: CommandCLIOpts) {
    const ctx = "enrichArgs";
    const { port, init, noWritePort, fast } = _.defaults(args, {
      init: false,
      noWritePort: false,
      fast: false,
    });
    const wsRoot = resolvePath(args.wsRoot, process.cwd());
    const ws = new WorkspaceService({ wsRoot });
    const { dev } = ws.config;
    const vaults = ConfigUtils.getVaults(ws.config);
    const vaultPaths = vaults.map((v) => resolvePath(v.fsPath, wsRoot));

    // launches engine server in a separate process
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
    ws.writeMeta({ version: CLIUtils.getClientVersion() });

    if (!noWritePort) {
      EngineUtils.writeEnginePortForCLI({ port: _port, wsRoot });
    }
    const engine = DendronEngineClient.create({
      port: _port,
      vaults,
      ws: wsRoot,
    });

    if (init) {
      this.L.info({ ctx, msg: "pre:engine.init" });
      const out = await engine.init();

      // These events will only upload if the upload action completes before the
      // CLI command completes. They are uploaded on a best effort basis.
      // engine.onEngineNoteStateChanged((entries) => {
      //   const createCount = extractNoteChangeEntriesByType(
      //     entries,
      //     "create"
      //   ).length;

      //   const updateCount = extractNoteChangeEntriesByType(
      //     entries,
      //     "update"
      //   ).length;

      //   const deleteCount = extractNoteChangeEntriesByType(
      //     entries,
      //     "delete"
      //   ).length;

      //   CLIAnalyticsUtils.track(EngagementEvents.EngineStateChanged, {
      //     created: createCount,
      //     updated: updateCount,
      //     deleted: deleteCount,
      //   });
      // });

      if (out.error) {
        this.printError(out.error);
      }
    }
    return {
      data: {
        ...args,
        engine,
        wsRoot,
        init,
        fast,
        vaults: vaultPaths,
        port: _port,
        server,
        serverSockets,
      },
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
