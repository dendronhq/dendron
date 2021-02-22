import { DendronError, DVault } from "@dendronhq/common-all";
import { DendronEngineV2 } from "@dendronhq/engine-server";
import {
  PodClassEntryV4,
  PodItemV4,
  PodKind,
  PodUtils,
} from "@dendronhq/pods-core";
import _ from "lodash";
import path from "path";
import yargs from "yargs";
import { BaseCommand } from "./base";

type CommandOpts = {
  engineClient: DendronEngineV2;
  podClass: PodClassEntryV4;
  config: any;
  wsRoot: string;
};

type CommandOutput = void;

export function fetchPodClassV4(
  podId: string,
  opts: {
    podSource: CommandCLIOpts["podSource"];
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

export enum PodSource {
  REMOTE = "remote",
  BUILTIN = "builtin",
}

export type CommandCLIOpts = {
  podId: string;
  wsRoot: string;
  vault: DVault;
  podSource?: PodSource;
};

export abstract class PodCLICommand extends BaseCommand<
  CommandOpts,
  CommandOutput
> {
  static async buildArgsCore(
    args: yargs.Argv<CommandCLIOpts>,
    _podItems: PodItemV4[]
  ) {
    args.option("podId", {
      describe: "pod to use",
      //choices: podItems.map(ent => ent.id)
    });
    args.option("vault", {
      describe: "location of vault",
    });
    args.option("wsRoot", {
      describe: "location of workspace",
    });
    // args.option("podSource", {
    //   describe: "what kind of pod are you using",
    //   choices: ["remote", "builtin"],
    //   default: "builtin"
    // });
  }

  async enrichArgs(
    args: CommandCLIOpts,
    pods: PodClassEntryV4[],
    podType: "import" | "export"
  ): Promise<CommandOpts> {
    const { vault, podId, wsRoot, podSource } = _.defaults(args, {
      podSource: "builtin",
    });
    const podsDir = path.join(wsRoot, "pods");
    const logger = this.L;
    const engineClient = DendronEngineV2.createV3({
      vaults: [vault],
      wsRoot,
      logger,
    });
    await engineClient.init();

    const podClass = fetchPodClassV4(podId, { podSource, pods, podType });
    const maybeConfig = PodUtils.getConfig({ podsDir, podClass });
    if (!maybeConfig) {
      const podConfigPath = PodUtils.getConfigPath({ podsDir, podClass });
      throw new DendronError({
        status: "no-config",
        msg: `no config found. please create a config at ${podConfigPath}`,
      });
    }
    return {
      podClass,
      config: maybeConfig,
      wsRoot,
      engineClient,
    };
  }

  async execute(opts: CommandOpts) {
    const { podClass, config, wsRoot, engineClient } = opts;
    const vaults = engineClient.vaultsv3;
    const pod = new podClass();
    await pod.execute({ wsRoot, config, engine: engineClient, vaults });
  }
}
