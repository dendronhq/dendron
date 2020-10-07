import { DendronError } from "@dendronhq/common-all";
import { resolvePath } from "@dendronhq/common-server";
import { DConfig, Git } from "@dendronhq/engine-server";
import _ from "lodash";
import yargs from "yargs";
import { BuildSiteCommand, BuildSiteCommandCLIOpts } from "./build-site";
import { SoilCommand, SoilCommandOpts } from "./soil";

type CommandOutput = { buildNotesRoot: string };

type CommandOpts = SoilCommandOpts & Required<CommandCLIOpts>;

export { CommandOpts as PublishNotesCommandOpts };
export type CommandCLIOpts = BuildSiteCommandCLIOpts & {
  buildPod?: boolean;
  noPush?: boolean;
  incremental?: boolean;
  publishRepoDir?: string;
};

export class PublishNotesCommand extends SoilCommand<
  CommandCLIOpts,
  CommandOpts,
  CommandOutput
> {
  buildArgs(args: yargs.Argv) {
    new BuildSiteCommand().buildArgs(args);
    args.option("noPush", {
      describe: "don't push the result",
      type: "boolean",
    });
    args.option("publishRepoDir", {
      describe: "repo to publish from. default is same as `wsRoot`",
    });
  }

  enrichArgs(args: CommandCLIOpts) {
    //const cleanArgs = super._enrichArgs(args);
    const cleanArgs = new BuildSiteCommand().enrichArgs(args);
    let out = _.defaults(
      { ...args, ...cleanArgs },
      {
        buildPod: true,
        noPush: false,
        incremental: false,
        dryRun: false,
        publishRepoDir: cleanArgs.wsRoot,
      }
    );
    chout.publishRepoDir = resolvePath(out.publishRepoDir, out.wsRoot);
    return out;
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
    const { publishRepoDir } = opts;
    const repo = await Git.getRepo(publishRepoDir);
    if (!repo) {
      throw new DendronError({ msg: "no repo found" });
    }
    return true;
  }

  async execute(opts: CommandOpts) {
    const { wsRoot, noPush, incremental, writeStubs, publishRepoDir } = opts;
    const engine = opts.engine;
    const config = DConfig.getOrCreate(wsRoot);
    const siteConfig = config.site;
    const git = new Git({ localUrl: publishRepoDir });

    if (!noPush) {
      await this.sanity(opts);
    }

    const { buildNotesRoot } = await new BuildSiteCommand().execute({
      engine,
      config: siteConfig,
      wsRoot: wsRoot,
      incremental,
      writeStubs,
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
