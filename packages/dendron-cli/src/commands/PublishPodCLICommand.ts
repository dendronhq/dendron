import { readYAML } from "@dendronhq/common-server";
import {
  getAllPublishPods,
  getPodConfig,
  PodClassEntryV3,
  PodItemV3,
  PodKind,
  PublishPodOpts,
} from "@dendronhq/pods-core";
import _ from "lodash";
import path from "path";
import yargs from "yargs";
import { fetchPodClassV3 } from "./pod";
import { SoilCommandCLIOpts, SoilCommandOptsV2, SoilCommandV2 } from "./soil";

type CommandOutput = {};

type CommandOpts = SoilCommandOptsV2 & {
  podClass: PodClassEntryV3;
  config: any;
  noteByName: string;
};

type CommandCLIOpts = SoilCommandCLIOpts & {
  podId: string;
  podSource?: "remote" | "builtin";
  config?: string;
  noteByName: string;
};

function buildPodArgs(args: yargs.Argv, _podItems: PodItemV3[]) {
  args.option("podId", {
    describe: "pod to use",
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
  const { podId, wsRoot, podSource, config } = _.defaults(args, {
    podSource: "builtin",
  });
  const podsDir = path.join(wsRoot, "pods");
  const podClass = fetchPodClassV3(podId, { podSource, pods, podType });
  let cleanConfig: any;
  if (config) {
    cleanConfig = readYAML(config);
  } else {
    cleanConfig = getPodConfig(podsDir, podClass);
  }
  return {
    podClass,
    config: cleanConfig,
  };
}

export { CommandOpts as PublishPodCommandOpts };
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
    return { ...opts, ...opts2, noteByName: args.noteByName };
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
    const { podClass, vault, wsRoot, engine, config, noteByName: fname } = opts;
    const pod = new podClass({
      vaults: [vault],
      wsRoot,
      engine,
    });
    await pod.plant({ mode: "notes", config, fname } as PublishPodOpts);
    return {};
  }
}
