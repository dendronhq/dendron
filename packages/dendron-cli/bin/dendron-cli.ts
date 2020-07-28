/* eslint-disable no-unused-expressions */
import { DendronEngine } from "@dendronhq/engine-server";
import yargs from "yargs";
import { BackfillCliOpts, BackfillCommand } from "../src/commands/backfill";
import { BuildSiteCliOpts, BuildSiteCommand } from "../src/commands/build-site";

yargs
  .command<BackfillCliOpts>(
    "backfill",
    "backfill frontmatter",
    args => {
      args.option("vault", {
        describe: "location of vault"
      });
      args.option("overwriteFields", {
        describe: "location of site dir",
        array: true,
        default: []
      });
    },
    async args => {
      const { vault, overwriteFields } = args;
      const cmd = new BackfillCommand();
      const engine = DendronEngine.getOrCreateEngine({ root: vault });
      await engine.init();
      await cmd.execute({ engine, overwriteFields });
    }
  )
  .command<BuildSiteCliOpts>(
    "build-site",
    "build static site",
    args => {
      args.option("vault", {
        describe: "location of vault"
      });
      args.option("siteRoot", {
        describe: "location of site dir"
      });
    },
    async args => {
      const { vault, siteRoot } = args;
      const cmd = new BuildSiteCommand();
      const engine = DendronEngine.getOrCreateEngine({ root: vault });
      await engine.init();
      await cmd.execute({ engine, siteRoot });
    }
  )
  .demandCommand(1)
  .help().argv;
