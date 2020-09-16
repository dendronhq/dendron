import { DendronError } from "@dendronhq/common-all/src";
import { DConfig, DendronEngine, Git } from "@dendronhq/engine-server";
import _ from "lodash";
import yargs from "yargs";
import { BaseCommand } from "./base";
import { BuildSiteCommand } from "./build-site";

type CommandOpts = Required<CommandCLIOpts>;

type CommandOutput = { buildNotesRoot: string };

export type CommandCLIOpts = {
  wsRoot: string;
  vault: string;
  buildPod?: boolean;
  noPush?: boolean;
};

export class PublishNotesCommand extends BaseCommand<
  CommandOpts,
  CommandOutput
> {
  static async buildArgs(args: yargs.Argv<CommandCLIOpts>) {
    args.option("wsRoot", {
      describe: "location of workspace",
      type: "string",
    });
    args.option("vault", {
      describe: "location of your vault",
      type: "string",
    });
    args.option("noPush", {
      describe: "don't push the result",
      type: "boolean",
    });
  }

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    return _.defaults(args, { buildPod: true, noPush: false });
  }

  static async run(args: CommandCLIOpts) {
    const ctx = "PublishNotes:run";
    const cmd = new PublishNotesCommand();
    cmd.L.info({ ctx, msg: "enter", args });
    const opts = await cmd.enrichArgs(args);
    cmd.L.info({ ctx, msg: "enrichArgs:post", args });
    const resp = await cmd.execute(opts);
    cmd.L.info({ ctx, msg: "exit", args });
    return resp;
  }

  async sanity(opts: CommandOpts) {
    const { wsRoot } = opts;
    const repo = await Git.isRepo(wsRoot);
    if (!repo) {
      throw new DendronError({ msg: "no repo found" });
    }
    return true;
  }

  async execute(opts: CommandOpts) {
    const { wsRoot, vault, noPush } = opts;
    const engine = DendronEngine.getOrCreateEngine({
      root: vault,
      forceNew: true,
      mode: "exact",
    });
    await engine.init();
    const config = DConfig.getOrCreate(wsRoot);
    const siteConfig = config.site;

    if (!noPush) {
      await this.sanity(opts);
    }

    const { buildNotesRoot } = await new BuildSiteCommand().execute({
      engine,
      config: siteConfig,
      dendronRoot: vault,
    });

    return {
      buildNotesRoot,
    };
  }
}
