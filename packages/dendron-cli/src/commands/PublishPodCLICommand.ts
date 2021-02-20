import { readYAML } from "@dendronhq/common-server";
import {
  getAllPublishPods,
  PodClassEntryV4,
  PodItemV4,
  PodKind,
  PodUtils,
} from "@dendronhq/pods-core";
import _ from "lodash";
import path from "path";
import yargs from "yargs";
import { fetchPodClassV4, PodSource } from "./pod";
import { SoilCommandCLIOpts, SoilCommandOptsV2, SoilCommandV2 } from "./soil";

type CommandOutput = {};

type CommandOpts = SoilCommandOptsV2 & {
  podClass: PodClassEntryV4;
  config: any;
  noteByName: string;
};

type CommandCLIOpts = SoilCommandCLIOpts & {
  podId: string;
  podSource?: "remote" | "builtin";
  config?: string;
  noteByName: string;
};

function buildPodArgs(args: yargs.Argv, _podItems: PodItemV4[]) {
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
  pods: PodClassEntryV4[],
  podType: PodKind
) {
  const { podId, wsRoot, podSource, config } = _.defaults(args, {
    podSource: PodSource.BUILTIN,
  });
  const podsDir = path.join(wsRoot, "pods");
  const podClass = fetchPodClassV4(podId, { podSource, pods, podType });
  let cleanConfig: any;
  if (config) {
    cleanConfig = readYAML(config);
  } else {
    cleanConfig = PodUtils.getConfig({ podsDir, podClass });
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
      { ...args, ...opts, vault: opts.vault },
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
    const pod = new podClass();
    await pod.execute({
      config: { ...config, fname },
      vaults: [vault],
      wsRoot,
      engine,
    });
    return {};
  }
}
