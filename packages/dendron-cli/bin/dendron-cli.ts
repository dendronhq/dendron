#!/usr/bin/env node

import { env, setEnv } from "@dendronhq/common-all";

if (!env("LOG_LEVEL", { shouldThrow: false })) {
  setEnv("LOG_LEVEL", "error");
}

import { DendronEngine } from "@dendronhq/engine-server";
import yargs from "yargs";
import { BuildSiteCommand } from "../src";
import { BackfillCliOpts, BackfillCommand } from "../src/commands/backfill";
import { ExportPodCLICommand } from "../src/commands/exportPod";
import { ImportPodCLICommand } from "../src/commands/importPod";
import { PlantSeedCommand } from "../src/commands/plantSeed";
import { PublishNotesCommand } from "../src/commands/publishNotes";
import { PublishPodCLICommand } from "../src/commands/PublishPodCLICommand";
import { RefactorRule } from "../src/commands/refactorBase";

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
  .command<BackfillCliOpts>(
    "backfill",
    "backfill frontmatter",
    (args) => {
      args.option("vault", {
        describe: "location of vault",
      });
      args.option("overwriteFields", {
        describe: "location of site dir",
        array: true,
        default: [],
      });
    },
    async (args) => {
      const { vault, overwriteFields } = args;
      const cmd = new BackfillCommand();
      const engine = DendronEngine.getOrCreateEngine({ root: vault });
      await engine.init();
      await cmd.execute({ engine, overwriteFields });
    }
  )
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

PlantSeedCommand.buildCmd(buildYargs);
BuildSiteCommand.buildCmd(buildYargs);
PublishNotesCommand.buildCmd(buildYargs);
PublishPodCLICommand.buildCmd(buildYargs);
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
