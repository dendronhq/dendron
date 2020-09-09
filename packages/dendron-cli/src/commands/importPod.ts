import { DendronError, DEngine } from "@dendronhq/common-all";
import { DendronEngine } from "@dendronhq/engine-server";
import {
  getAllImportPods,
  getPodConfig,
  podClassEntryToPodItem,
  PodClassEntryV2,
  PodItem,
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

export class ImportPodCLICommand extends BaseCommand<
  CommandOpts,
  CommandOutput
> {
  static async buildArgs(args: yargs.Argv<CommandCLIOpts>) {
    const podItems: PodItem[] = getAllImportPods().map((p) =>
      podClassEntryToPodItem(p)
    );
    args.option("podId", {
      describe: "pod to use",
      choices: podItems.map((ent) => ent.id),
    });
    args.option("vault", {
      describe: "location of vault",
    });
  }

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    const ctx = "ImportPod:enrichArgs";
    const { vault, podId, podsDir } = args;
    const engine = DendronEngine.getOrCreateEngine({
      root: vault,
      forceNew: true,
    });
    const podClass = _.find(getAllImportPods(), {
      id: podId,
    }) as PodClassEntryV2;
    const maybeConfig = getPodConfig(podsDir, podClass);
    if (!maybeConfig) {
      this.L.error({ msg: "no-config", ctx });
      throw new DendronError({ msg: "no-config" });
    }
    return {
      engine,
      podClass,
      config: maybeConfig,
    };
  }

  async execute(opts: CommandOpts) {
    const ctx = "ImportPod";
    this.L.info({ ctx, msg: "enter" });
    const { podClass, engine, config } = opts;
    const root = engine.props.root;
    const pod = new podClass({
      roots: [root],
    });
    await pod.plant({ mode: "notes", config: config });
    this.L.info({ ctx, msg: "exit" });
    return;
  }

  static async run(args: CommandCLIOpts) {
    const ctx = "ImportPod:run";
    const cmd = new ImportPodCLICommand();
    cmd.L.info({ ctx, msg: "enter", args });
    const opts = await cmd.enrichArgs(args);
    cmd.L.info({ ctx, msg: "enrichArgs:post", args });
    await cmd.execute(opts);
    cmd.L.info({ ctx, msg: "exit", args });
    return cmd;
  }
}
