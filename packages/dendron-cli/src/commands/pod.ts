import { DendronError, DEngine } from "@dendronhq/common-all";
import { DendronEngine } from "@dendronhq/engine-server";
import {
  getPodConfig,
  PodClassEntryV2,
  PodItem,
  getPodConfigPath,
} from "@dendronhq/pods-core";
import _ from "lodash";
import yargs from "yargs";
import { BaseCommand } from "./base";

type CommandOpts = {
  engine: DEngine;
  podClass: PodClassEntryV2;
  config: any;
};

type CommandOutput = void;

type CommandCLIOpts = {
  podId: string;
  podsDir: string;
  vault: string;
};

export { CommandCLIOpts as ImportPodCLIOpts };

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
    args.option("podsDir", {
      describe: "location of pods dir",
    });
  }

  async enrichArgs(
    args: CommandCLIOpts,
    pods: PodClassEntryV2[]
  ): Promise<CommandOpts> {
    const { vault, podId, podsDir } = args;
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
    };
  }

  async execute(opts: CommandOpts) {
    const { podClass, engine, config } = opts;
    const root = engine.props.root;
    const pod = new podClass({
      roots: [root],
    });
    await pod.plant({ mode: "notes", config: config });
  }
}
