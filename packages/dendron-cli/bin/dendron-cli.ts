#!/usr/bin/env node

/* eslint-disable no-unused-expressions */
import { DConfig, DendronEngine } from "@dendronhq/engine-server";
import yargs from "yargs";
import { BackfillCliOpts, BackfillCommand } from "../src/commands/backfill";
import { BuildSiteCliOpts, BuildSiteCommand } from "../src/commands/build-site";
import { ExportPodCLICommand } from "../src/commands/exportPod";
import { ImportPodCLICommand } from "../src/commands/importPod";
import { PlantSeedCommand } from "../src/commands/plantSeed";
import { PublishNotesCommand } from "../src/commands/publishNotes";
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
    "build-site",
    "build static site",
    (args: yargs.Argv<BuildSiteCliOpts>) => {
      args.option("vault", {
        describe: "location of vault",
      });
      args.option("dendronRoot", {
        describe: "location to dendronRoot",
      });
    },
    async (args: any) => {
      const { vault, dendronRoot } = args;
      const config = DConfig.getOrCreate(dendronRoot).site;
      const cmd = new BuildSiteCommand();
      const engine = DendronEngine.getOrCreateEngine({ root: vault });
      await engine.init();
      await cmd.execute({ engine, config, dendronRoot });
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
PublishNotesCommand.buildCmd(buildYargs);
//.command(...PlantSeedCommand.cmd())
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
