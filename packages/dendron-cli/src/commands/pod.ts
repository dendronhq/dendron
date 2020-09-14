import { DendronError, DEngine } from "@dendronhq/common-all";
import { DendronEngine } from "@dendronhq/engine-server";
import {
  getPodConfig,
  PodClassEntryV2,
  PodItem,
  getPodConfigPath,
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

export type CommandCLIOpts = {
  podId: string;
  wsRoot: string;
  //podsDir: string;
  vault: string;
};

export abstract class PodCLICommand extends BaseCommand<
  CommandOpts,
  CommandOutput
> {
  static async buildArgsCore(
    args: yargs.Argv<CommandCLIOpts>,
    podItems: PodItem[]
  ) {
    args.option("podId", {
      describe: "pod to use",
      choices: podItems.map((ent) => ent.id),
    });
    args.option("vault", {
      describe: "location of vault",
    });
    args.option("wsRoot", {
      describe: "location of workspace",
    });
  }

  async enrichArgs(
    args: CommandCLIOpts,
    pods: PodClassEntryV2[]
  ): Promise<CommandOpts> {
    const { vault, podId, wsRoot } = args;
    const podsDir = path.join(wsRoot, "pods");
    const engine = DendronEngine.getOrCreateEngine({
      root: vault,
      forceNew: true,
    });
    const podClass = _.find(pods, {
      id: podId,
    }) as PodClassEntryV2;
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
