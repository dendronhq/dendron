import { DendronError, DEngine } from "@dendronhq/common-all";
import { DendronEngine } from "@dendronhq/engine-server";
import {
  getAllExportPods,
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

export { CommandCLIOpts as ExportPodCLIOpts };

export class ExportPodCLICommand extends BaseCommand<
  CommandOpts,
  CommandOutput
> {
  static pods = getAllExportPods();

  static async buildArgs(args: yargs.Argv<CommandCLIOpts>) {
    const podItems: PodItem[] = ExportPodCLICommand.pods.map((p) =>
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
    const { vault, podId, podsDir } = args;
    const engine = DendronEngine.getOrCreateEngine({ root: vault });
    const podClass = _.find(ExportPodCLICommand.pods, {
      id: podId,
    }) as PodClassEntryV2;
    const maybeConfig = getPodConfig(podsDir, podClass);
    if (!maybeConfig) {
      throw new DendronError({ msg: "no-config" });
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

  static async run(args: CommandCLIOpts) {
    const cmd = new ExportPodCLICommand();
    const opts = await cmd.enrichArgs(args);
    return cmd.execute(opts);
  }
}
