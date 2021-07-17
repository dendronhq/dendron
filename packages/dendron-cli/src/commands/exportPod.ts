import { getAllExportPods } from "@dendronhq/pods-core";
import yargs from "yargs";
import { CLICommand } from "./base";
import { enrichPodArgs, PodCLIOpts, setupPodArgs } from "./pod";
import { setupEngineArgs, SetupEngineCLIOpts, SetupEngineResp } from "./utils";

export { CommandCLIOpts as ExportPodCLIOpts };

type CommandCLIOpts = {} & SetupEngineCLIOpts & PodCLIOpts;

type CommandOpts = CommandCLIOpts & {
  podClass: any;
  config: any;
} & SetupEngineResp;

type CommandOutput = void;

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
    return enrichPodArgs({ pods: getAllExportPods(), podType: "export" })(args);
  }

  static getPods() {
    return getAllExportPods();
  }

  async execute(opts: CommandOpts) {
    const { podClass: PodClass, config, wsRoot, engine, server } = opts;
    const vaults = engine.vaults;
    const pod = new PodClass();
    // eslint-disable-next-line no-console
    console.log("running pod...");
    await pod.execute({ wsRoot, config, engine, vaults });
    server.close((err: any) => {
      if (err) {
        this.L.error({ msg: "error closing", payload: err });
      }
    });
    // eslint-disable-next-line no-console
    console.log("done");
  }
}
