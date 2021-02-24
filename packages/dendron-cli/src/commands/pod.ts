import { DendronError } from "@dendronhq/common-all";
import { PodClassEntryV4, PodKind, PodUtils } from "@dendronhq/pods-core";
import _ from "lodash";
import path from "path";
import yargs from "yargs";
import { setupEngine, SetupEngineCLIOpts, SetupEngineResp } from "./utils";

export type PodCLIOpts = {
  podId: string;
  showConfig?: boolean;
  genConfig?: boolean;
  podSource: PodSource;
  podPkg?: string;
  config?: string;
};

export type PodCommandCLIOpts = {} & SetupEngineCLIOpts & PodCLIOpts;

export type PodCommandOpts<T = any> = PodCLIOpts & {
  podClass: any;
  config: T;
} & SetupEngineResp &
  SetupEngineCLIOpts;

export function fetchPodClassV4(
  podId: string,
  opts: {
    podSource: PodSource;
    pods?: PodClassEntryV4[];
    podPkg?: string;
    wsRoot?: string;
    podType: PodKind;
  }
): PodClassEntryV4 {
  const { podSource, pods } = opts;
  if (podSource === "builtin") {
    if (!pods) {
      throw Error("pods needs to be defined");
    }
    const podClass = _.find(pods, {
      id: podId,
    });
    if (_.isUndefined(podClass)) {
      throw Error("no pod found");
    }
    return podClass;
  } else {
    if (!opts.podPkg || !opts.wsRoot) {
      throw Error("podPkg not defined");
    }
    const podEntries = require(`${path.join(
      opts.wsRoot,
      "node_modules",
      opts.podPkg
    )}`).pods as PodClassEntryV4[];
    const podClass = _.find(podEntries, (entry) => {
      return entry.id === podId && entry.kind === opts.podType;
    });
    if (!podClass) {
      throw Error("no podClass found");
    }
    return podClass;
  }
}

export function setupPodArgs(args: yargs.Argv) {
  args.option("podId", {
    describe: "id of pod to use",
    requiresArg: true,
  });
  args.option("showConfig", {
    describe: "show pod configuration",
  });
  args.option("genConfig", {
    describe: "show pod configuration",
  });
  args.option("podPkg", {
    describe: "if specifying a remote pod, name of pkg",
  });
  args.option("config", {
    describe:
      "pass in config instead of reading from file. format is comma delimited {key}={value} pairs",
  });
  args.option("podSource", {
    describe: "podSource",
    choices: _.values(PodSource),
    default: PodSource.BUILTIN,
  });
}

export const enrichPodArgs = (opts: {
  pods: PodClassEntryV4[];
  podType: PodKind;
}) => {
  const { pods, podType } = opts;

  const enrichFunc = async (
    args: PodCommandCLIOpts
  ): Promise<PodCommandOpts> => {
    const {
      podId,
      wsRoot,
      showConfig,
      podSource,
      podPkg,
      genConfig,
      config,
    } = args;

    const engineArgs = await setupEngine(args);
    const podClass = fetchPodClassV4(podId, {
      pods,
      podType,
      podSource,
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
      const configPath = PodUtils.genConfigFile({
        podsDir,
        podClass,
        force: true,
      });
      console.log(`config generated at ${configPath}`);
      process.exit(0);
    }
    const podsDir = path.join(wsRoot, "pods");

    let cleanConfig: any;

    if (config) {
      cleanConfig = {};
      config.split(",").map((ent) => {
        const [k, v] = ent.split("=");
        cleanConfig[k] = v;
      });
    } else {
      const cleanConfig = PodUtils.getConfig({ podsDir, podClass });
      if (!cleanConfig) {
        const podConfigPath = PodUtils.getConfigPath({ podsDir, podClass });
        throw new DendronError({
          status: "no-config",
          msg: `no config found. please create a config at ${podConfigPath}`,
        });
      }
    }
    return { ...args, ...engineArgs, podClass, config: cleanConfig };
  };
  return enrichFunc;
};

export const executePod = async (opts: PodCommandOpts) => {
  const { podClass: PodClass, config, wsRoot, engine, server } = opts;
  const vaults = engine.vaultsv3;
  const pod = new PodClass();
  console.log("running pod...");
  await pod.execute({ wsRoot, config, engine, vaults });
  server.close((err: any) => {
    if (err) {
      throw err;
    }
  });
  console.log("done");
};
export enum PodSource {
  REMOTE = "remote",
  BUILTIN = "builtin",
}
