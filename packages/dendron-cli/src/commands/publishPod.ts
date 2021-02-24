import {
  getAllPublishPods,
  PublishPodConfigV3,
  PublishPodV3,
} from "@dendronhq/pods-core";
import yargs from "yargs";
import { CLICommand } from "./base";
import { enrichPodArgs, PodCLIOpts, setupPodArgs } from "./pod";
import { setupEngineArgs, SetupEngineCLIOpts, SetupEngineResp } from "./utils";

type CommandCLIOpts = {} & SetupEngineCLIOpts & PodCLIOpts;

type CommandOpts = CommandCLIOpts & {
  podClass: any;
  config: PublishPodConfigV3;
} & SetupEngineResp;

type CommandOutput = void;

export class PublishPodCLICommand extends CLICommand<
  CommandOpts,
  CommandOutput
> {
  constructor() {
    super({
      name: "publishPod",
      desc: "publish a note",
    });
  }

  buildArgs(args: yargs.Argv<CommandCLIOpts>) {
    super.buildArgs(args);
    setupEngineArgs(args);
    setupPodArgs(args);
  }

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    return enrichPodArgs({ pods: getAllPublishPods(), podType: "publish" })(
      args
    );
  }

  async execute(opts: CommandOpts) {
    const { podClass: PodClass, config, wsRoot, engine, server } = opts;
    const vaults = engine.vaultsv3;
    const pod = new PodClass() as PublishPodV3;
    const resp = await pod.execute({ wsRoot, config, engine, vaults });
    if (config.dest === "stdout") {
      console.log(resp);
    }
    server.close((err: any) => {
      if (err) {
        this.L.error({ msg: "error closing", payload: err });
      }
    });
  }
}
