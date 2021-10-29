import { DendronError } from "@dendronhq/common-all";
import { getAllExportPods } from "@dendronhq/pods-core";
import yargs from "yargs";
import { CLICommand, CommandCommonProps } from "./base";
import { enrichPodArgs, PodCLIOpts, setupPodArgs } from "./pod";
import { setupEngineArgs, SetupEngineCLIOpts, SetupEngineResp } from "./utils";

export { CommandCLIOpts as ExportPodCLIOpts };

type CommandCLIOpts = {} & SetupEngineCLIOpts & PodCLIOpts;

type CommandOpts = CommandCLIOpts & {
  podClass: any;
  config: any;
} & SetupEngineResp &
  CommandCommonProps;

type CommandOutput = CommandCommonProps;

export class ExportPodCLICommand extends CLICommand<
  CommandOpts,
  CommandOutput
> {
  constructor() {
    super({
      name: "exportPod",
      desc: "use a pod to export notes",
    });
  }

  buildArgs(args: yargs.Argv<CommandCLIOpts>) {
    super.buildArgs(args);
    setupEngineArgs(args);
    setupPodArgs(args);
  }

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    this.addArgsToPayload({ podId: args.podId });
    return enrichPodArgs({ pods: getAllExportPods(), podType: "export" })(args);
  }

  static getPods() {
    return getAllExportPods();
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const ctx = "execute";
    const {
      podClass: PodClass,
      config,
      wsRoot,
      engine,
      server,
      serverSockets,
    } = opts;
    const vaults = engine.vaults;
    const pod = new PodClass();
    this.L.info({ ctx, msg: "running pod..." });
    await pod.execute({ wsRoot, config, engine, vaults });
    this.L.info({ ctx, msg: "done execute" });
    return new Promise((resolve) => {
      server.close((err: any) => {
        this.L.info({ ctx, msg: "closing server" });
        // close outstanding connections
        serverSockets?.forEach((socket) => socket.destroy());
        if (err) {
          return resolve({
            error: new DendronError({ message: "error closing", payload: err }),
          });
        }
        resolve({ error: undefined });
      });
    });
  }
}
