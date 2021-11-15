/* eslint-disable import/no-dynamic-require */
import { DendronError, RespV3 } from "@dendronhq/common-all";
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
  configPath?: string;
  query?: string;
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
  if (podSource === PodSource.BUILTIN) {
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
    // eslint-disable-next-line global-require
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
    describe: "if specifying a custom pod, name of pkg",
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

export function enrichPodArgs(opts: {
  pods: PodClassEntryV4[];
  podType: PodKind;
}) {
  const { pods, podType } = opts;

  const enrichFunc = async (
    args: PodCommandCLIOpts
  ): Promise<RespV3<PodCommandOpts>> => {
    const { podId, showConfig, podSource, podPkg, genConfig, config } = args;

    const engineArgs = await setupEngine(args);
    // normalized wsRoot
    const wsRoot = engineArgs.wsRoot;
    const podClass = fetchPodClassV4(podId, {
      pods,
      podType,
      podSource,
      podPkg,
      wsRoot,
    });

    // if show config, output configuration and exit
    if (showConfig) {
      // eslint-disable-next-line new-cap
      const config = new podClass().config;
      // eslint-disable-next-line no-console
      console.log(config);
      process.exit(0);
    }

    // if genConfig, create the file and exit
    if (genConfig) {
      const podsDir = PodUtils.getPodDir({ wsRoot });
      const configPath = PodUtils.genConfigFile({
        podsDir,
        podClass,
        force: true,
      });
      // eslint-disable-next-line no-console
      console.log(`config generated at ${configPath}`);
      process.exit(0);
    }

    // read the config file
    const podsDir = path.join(wsRoot, "pods");
    let cleanConfig: any = {};
    const resp = args.configPath
      ? PodUtils.readPodConfigFromDisk(args.configPath)
      : PodUtils.getConfig({
          podsDir,
          podClass,
        });
    if (resp.error && !config) {
      return {
        error: resp.error,
      };
    }
    if (resp.data) {
      cleanConfig = resp.data;
    }

    // if additional parameters are passed in, then add them to the config
    // add additional config
    if (config) {
      config.split(",").map((ent) => {
        const [k, v] = ent.split("=");
        cleanConfig[k] = v;
      });
    }

    // if query is specified, then override config to pass in query
    if (args.query) {
      if (podType === "publish") {
        cleanConfig["fname"] = args.query;
      } else {
        // eslint-disable-next-line no-console
        console.log(
          `WARN: --query parameter not implemented for podType ${podType}`
        );
      }
    }

    // error checking, config shouldn't be empty
    if (_.isEmpty(cleanConfig)) {
      const podConfigPath = PodUtils.getConfigPath({ podsDir, podClass });
      throw new DendronError({
        status: "no-config",
        message: `no config found. please create a config at ${podConfigPath}`,
      });
    }
    return {
      data: {
        ...args,
        ...engineArgs,
        podClass,
        config: cleanConfig,
      },
    };
  };
  return enrichFunc;
}

export const executePod = async (opts: PodCommandOpts) => {
  const { podClass: PodClass, config, wsRoot, engine, server } = opts;
  const vaults = engine.vaults;
  const pod = new PodClass();
  await pod.execute({ wsRoot, config, engine, vaults });
  server.close((err: any) => {
    if (err) {
      throw err;
    }
  });
};
export enum PodSource {
  CUSTOM = "custom",
  BUILTIN = "builtin",
}
