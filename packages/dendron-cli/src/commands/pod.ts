import { DendronError, DEngine } from "@dendronhq/common-all";
import { DendronEngine } from "@dendronhq/engine-server";
import {
  getPodConfig,
  getPodConfigPath,
  PodClassEntryV2,
  PodClassEntryV3,
  PodItem,
  PodKind,
} from "@dendronhq/pods-core";
import _ from "lodash";
import path from "path";
import yargs from "yargs";
import { BaseCommand } from "./base";

type CommandOpts = {
  engine: DEngine;
  podClass: PodClassEntryV2;
  config: any;
  wsRoot: string;
};

type CommandOutput = void;

export function fetchPodClass(
  podId: string,
  opts: {
    podSource: CommandCLIOpts["podSource"];
    pods?: PodClassEntryV2[] | PodClassEntryV3[];
    podType: PodKind;
  }
) {
  const { podSource, pods } = opts;
  if (podSource === "builtin") {
    if (!pods) {
      throw Error("pods needs to be defined");
    }
    const podClass = _.find(pods, {
      id: podId,
    });
    return podClass;
  } else {
    const podEntry = require(podId);
    const key = opts.podType === "import" ? "importPod" : "exportPod";
    const podClass = podEntry[key];
    if (!podClass) {
      throw Error("no podClass found");
    }
    return podClass;
  }
}

export function fetchPodClassV3(
  podId: string,
  opts: {
    podSource: CommandCLIOpts["podSource"];
    pods?: PodClassEntryV3[];
    podType: PodKind;
  }
) {
  const { podSource, pods } = opts;
  if (podSource === "builtin") {
    if (!pods) {
      throw Error("pods needs to be defined");
    }
    const podClass = _.find(pods, {
      id: podId,
    });
    return podClass;
  } else {
    const podEntry = require(podId);
    const podClass = podEntry[opts.podType];
    if (!podClass) {
      throw Error("no podClass found");
    }
    return podClass;
  }
}

export type CommandCLIOpts = {
  podId: string;
  wsRoot: string;
  vault: string;
  podSource?: "remote" | "builtin";
};

export abstract class PodCLICommand extends BaseCommand<
  CommandOpts,
  CommandOutput
> {
  static async buildArgsCore(
    args: yargs.Argv<CommandCLIOpts>,
    _podItems: PodItem[]
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
    pods: PodClassEntryV2[],
    podType: "import" | "export"
  ): Promise<CommandOpts> {
    const { vault, podId, wsRoot, podSource } = _.defaults(args, {
      podSource: "builtin",
    });
    const podsDir = path.join(wsRoot, "pods");
    const engine = DendronEngine.getOrCreateEngine({
      root: vault,
      forceNew: true,
    });
    const podClass = fetchPodClass(podId, { podSource, pods, podType });
    const maybeConfig = getPodConfig(podsDir, podClass);
    if (!maybeConfig) {
      const podConfigPath = getPodConfigPath(podsDir, podClass);
      throw new DendronError({
        status: "no-config",
        msg: `no config found. please create a config at ${podConfigPath}`,
      });
    }
    return {
      engine,
      podClass,
      config: maybeConfig,
      wsRoot,
    };
  }

  async execute(opts: CommandOpts) {
    const { podClass, engine, config, wsRoot } = opts;
    const root = engine.props.root;
    const pod = new podClass({
      roots: [root],
      wsRoot,
    });
    await pod.plant({ mode: "notes", config: config });
  }
}
