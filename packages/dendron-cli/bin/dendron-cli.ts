#!/usr/bin/env node

import { env, setEnv } from "@dendronhq/common-all";

if (!env("LOG_LEVEL", { shouldThrow: false })) {
  setEnv("LOG_LEVEL", "error");
}

import yargs from "yargs";
import { BuildSiteCommand } from "../src";
import { BuildSiteV2CLICommand } from "../src/commands/build-site-v2";
import { DoctorCLICommand } from "../src/commands/doctor";
import { ExportPodCLICommand } from "../src/commands/exportPod";
import { ImportPodCLICommand } from "../src/commands/importPod";
import { LaunchEngineServerCommand } from "../src/commands/launchEngineServer";
import { NoteCLICommand } from "../src/commands/notes";
import { PublishNotesCommand } from "../src/commands/publishNotes";
import { PublishPodCLICommand } from "../src/commands/PublishPodCLICommand";
import { RefactorRule } from "../src/commands/refactorBase";
import { WorkspaceCLICommand } from "../src/commands/workspace";

export const addLayout: RefactorRule = {
  name: "add fm",
  operation: "add",
  data: {
    from: { key: "layout" },
    to: { value: "single" },
  },
};
export const updateTime: RefactorRule = {
  operation: "title2time",
  data: {},
};

let buildYargs = yargs
  .command<any>(
    "exportPod",
    "export a pod",
    ExportPodCLICommand.buildArgs,
    async (args: any) => {
      return ExportPodCLICommand.run(args);
    }
  )
  .command<any>(
    "importPod",
    "import a pod",
    ImportPodCLICommand.buildArgs,
    async (args: any) => {
      return ImportPodCLICommand.run(args);
    }
  );

BuildSiteCommand.buildCmd(buildYargs);
PublishNotesCommand.buildCmd(buildYargs);
PublishPodCLICommand.buildCmd(buildYargs);
LaunchEngineServerCommand.buildCmd(buildYargs);
new BuildSiteV2CLICommand().buildCmd(buildYargs);
new DoctorCLICommand().buildCmd(buildYargs);
new WorkspaceCLICommand().buildCmd(buildYargs);
new NoteCLICommand().buildCmd(buildYargs);

/**
 * new Command().build(buildYargs)
 */
// .command<RefactorFMCliOpts>(
//   "refactorFM",
//   "refactor frontmatter",
//   (args) => {
//     args.option("vault", {
//       describe: "location of vault",
//     });
//   },
//   async (args) => {
//     const { vault } = args;
//     const cmd = new RefactorFMCommand();
//     await cmd.execute({
//       root: vault,
//       include: ["blog.thoughts.*"],
//       rule: updateTime,
//     });
//   }
// )
buildYargs.demandCommand(1).help().argv;
