import { getAllImportPods } from "@dendronhq/pods-core";
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

export class ImportPodCLICommand extends CLICommand<
  CommandOpts,
  CommandOutput
> {
  constructor() {
    super({
      name: "importPod",
      desc: "use a pod to import notes",
    });
  }

  buildArgs(args: yargs.Argv<CommandCLIOpts>) {
    super.buildArgs(args);
    setupEngineArgs(args);
    setupPodArgs(args);
  }

  async enrichArgs(args: CommandCLIOpts) {
    return enrichPodArgs({ pods: getAllImportPods(), podType: "import" })(args);
  }

  async execute(opts: CommandOpts) {
    const { podClass: PodClass, config, wsRoot, engine, server } = opts;
    const vaults = engine.vaultsv3;
    const pod = new PodClass();
    console.log("running pod...", config);
    await pod.execute({ wsRoot, config, engine, vaults });
    server.close((err: any) => {
      if (err) {
        this.L.error({ msg: "error closing", payload: err });
      }
    });
    console.log("done");
  }
}
