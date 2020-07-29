/* eslint-disable no-unused-expressions */
import { DendronEngine } from "@dendronhq/engine-server";
import yargs from "yargs";
import { BackfillCliOpts, BackfillCommand } from "../src/commands/backfill";
import { BuildSiteCliOpts, BuildSiteCommand, DendronSiteConfig } from "../src/commands/build-site";

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
      args.option("dendronRoot", {
        describe: "location to dendronRoot"
      });
    },
    async args => {
      const { vault, dendronRoot } = args;
      const config: DendronSiteConfig = {
        noteRoot: "root",
        siteRoot: "./docs-dev"
      };
      const cmd = new BuildSiteCommand();
      const engine = DendronEngine.getOrCreateEngine({ root: vault });
      await engine.init();
      await cmd.execute({ engine, config, dendronRoot });
    }
  )
  .demandCommand(1)
  .help().argv;
