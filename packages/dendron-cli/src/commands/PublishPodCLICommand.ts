import {
  getAllPublishPods,
  getPodConfig,
  PodClassEntryV3,
  PodItemV3,
  PodKind,
} from "@dendronhq/pods-core";
import _ from "lodash";
import path from "path";
import yargs from "yargs";
import { fetchPodClassV3 } from "./pod";
import { SoilCommandCLIOpts, SoilCommandOptsV2, SoilCommandV2 } from "./soil";

type CommandOutput = {};
type CommandOpts = SoilCommandOptsV2;
export type CommandCLIOpts = SoilCommandCLIOpts & {
  podId: string;
  podSource?: "remote" | "builtin";
  config?: string;
};

function buildPodArgs(args: yargs.Argv, _podItems: PodItemV3[]) {
  args.option("podId", {
    describe: "pod to use",
    //choices: podItems.map(ent => ent.id)
  });
  args.option("noteByName", {
    describe: "name of note",
  });
  args.option("config", {
    describe: "path to custom config",
  });
  args.option("config", {
    describe: "configuration to use",
  });
}

function enrichPodArgs(
  args: CommandCLIOpts,
  pods: PodClassEntryV3[],
  podType: PodKind
) {
  const { podId, wsRoot, podSource } = _.defaults(args, {
    podSource: "builtin",
  });
  const podsDir = path.join(wsRoot, "pods");
  const podClass = fetchPodClassV3(podId, { podSource, pods, podType });
  const maybeConfig = getPodConfig(podsDir, podClass);
  return {
    podClass,
    config: maybeConfig,
  };
}

export class PublishPodCLICommand extends SoilCommandV2<
  CommandCLIOpts,
  CommandOpts,
  CommandOutput
> {
  buildArgs(args: yargs.Argv) {
    super.buildArgs(args);
    buildPodArgs(args, []);
  }

  enrichArgs(args: CommandCLIOpts) {
    const opts = super._enrichArgs(args);
    const opts2 = enrichPodArgs(
      { ...args, ...opts },
      getAllPublishPods(),
      "publish"
    );
    return { ...opts, ...opts2 };
  }

  static buildCmd(yargs: yargs.Argv): yargs.Argv {
    const _cmd = new PublishPodCLICommand();
    return yargs.command(
      "publishPod",
      "publish pod",
      _cmd.buildArgs,
      _cmd.eval
    );
  }

  async execute(opts: CommandOpts) {
    console.log(JSON.stringify(_.omit(opts, "engine")));
    return {};
  }
}
