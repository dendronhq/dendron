import { DendronError, DEngineClientV2, Stage } from "@dendronhq/common-all";
import { getAllImportPods, PodUtils } from "@dendronhq/pods-core";
import _ from "lodash";
import path from "path";
import yargs from "yargs";
import { CLICommand } from "./base";
import { fetchPodClassV4, PodSource, setupPodArgs } from "./pod";
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
  // custom
  podId: string;
  showConfig?: boolean;
  genConfig?: boolean;
  podSource: PodSource;
  podPkg?: string;
} & SetupEngineCLIOpts;

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

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    const { podId, wsRoot, showConfig, podSource, podPkg, genConfig } = args;

    const engineArgs = await setupEngine(args);
    const pods = getAllImportPods();
    const podType = "import";
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
