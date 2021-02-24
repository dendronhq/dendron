import { DendronError, DEngineClientV2, Stage } from "@dendronhq/common-all";
import { getAllExportPods, PodUtils } from "@dendronhq/pods-core";
import path from "path";
import yargs from "yargs";
import { CLICommand } from "./base";
import { fetchPodClassV4, PodCLIOpts, setupPodArgs } from "./pod";
import {
  setupEngine,
  setupEngineArgs,
  SetupEngineCLIOpts,
  SetupEngineResp,
} from "./utils";

export { CommandCLIOpts as ExportPodCLIOpts };

type CommandCLIOpts = {
  port?: number;
  engine?: DEngineClientV2;
  cwd?: string;
  stage: Stage;
} & SetupEngineCLIOpts &
  PodCLIOpts;

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
    const { podId, wsRoot, showConfig, podSource, podPkg, genConfig } = args;

    const engineArgs = await setupEngine(args);
    const pods = getAllExportPods();
    const podType = "export";
    const podClass = fetchPodClassV4(podId, {
      podSource,
      pods,
      podType,
      podPkg,
      wsRoot,
    });
    if (showConfig) {
      const config = new podClass().config;
      console.log(config);
      process.exit(0);
    }
    if (genConfig) {
      const podsDir = PodUtils.getPodDir({ wsRoot });
      const configPath = PodUtils.genConfigFile({ podsDir, podClass });
      console.log(`config generated at ${configPath}`);
      process.exit(0);
    }
    const podsDir = path.join(wsRoot, "pods");
    const maybeConfig = PodUtils.getConfig({ podsDir, podClass });
    if (!maybeConfig) {
      const podConfigPath = PodUtils.getConfigPath({ podsDir, podClass });
      throw new DendronError({
        status: "no-config",
        msg: `no config found. please create a config at ${podConfigPath}`,
      });
    }
    return { ...args, ...engineArgs, podClass, config: maybeConfig };
  }

  static getPods() {
    return getAllExportPods();
  }

  async execute(opts: CommandOpts) {
    const { podClass: PodClass, config, wsRoot, engine, server } = opts;
    const vaults = engine.vaultsv3;
    const pod = new PodClass();
    console.log("running pod...");
    await pod.execute({ wsRoot, config, engine, vaults });
    server.close((err: any) => {
      if (err) {
        this.L.error({ msg: "error closing", payload: err });
      }
    });
    console.log("done");
  }
}
