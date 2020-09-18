import { DendronError } from "@dendronhq/common-all";
import { DConfig, Git } from "@dendronhq/engine-server";
import _ from "lodash";
import yargs from "yargs";
import { BuildSiteCommand } from "./build-site";
import { SoilCommand, SoilCommandCLIOpts, SoilCommandOpts } from "./soil";

type CommandOutput = { buildNotesRoot: string };

type CommandOpts = SoilCommandOpts & Required<CommandCLIOpts>;

export type CommandCLIOpts = SoilCommandCLIOpts & {
  buildPod?: boolean;
  noPush?: boolean;
};

export class PublishNotesCommand extends SoilCommand<
  CommandCLIOpts,
  CommandOpts,
  CommandOutput
> {
  buildArgs(args: yargs.Argv) {
    super.buildArgs(args);
    args.option("noPush", {
      describe: "don't push the result",
      type: "boolean",
    });
  }

  enrichArgs(args: CommandCLIOpts) {
    const cleanArgs = super._enrichArgs(args);
    //return _.defaults({...args, ...cleanArgs}, {});
    return _.defaults(
      { ...args, ...cleanArgs },
      { buildPod: true, noPush: false }
    );
  }

  static buildCmd(yargs: yargs.Argv): yargs.Argv {
    const _cmd = new PublishNotesCommand();
    return yargs.command(
      "publishNotes",
      "Build, commit, and push your notes for publication",
      _cmd.buildArgs,
      _cmd.eval
    );
  }

  static async run(args: CommandCLIOpts) {
    const cmd = new PublishNotesCommand();
    return cmd.eval(args);
  }

  async sanity(opts: CommandOpts) {
    const { wsRoot } = opts;
    const repo = await Git.getRepo(wsRoot);
    if (!repo) {
      throw new DendronError({ msg: "no repo found" });
    }
    return true;
  }

  async execute(opts: CommandOpts) {
    const { wsRoot, noPush } = opts;
    const engine = opts.engine;
    const config = DConfig.getOrCreate(wsRoot);
    const siteConfig = config.site;
    const git = new Git({ localUrl: wsRoot });

    if (!noPush) {
      await this.sanity(opts);
    }

    const { buildNotesRoot } = await new BuildSiteCommand().execute({
      engine,
      config: siteConfig,
      wsRoot: wsRoot,
    });

    if (!noPush) {
      await git.addAll();
      await git.commit({ msg: "chore: publish" });
      await git.push();
    }

    return {
      buildNotesRoot,
    };
  }
}
