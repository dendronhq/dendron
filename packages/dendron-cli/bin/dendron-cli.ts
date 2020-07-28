/* eslint-disable no-unused-expressions */
import { DendronEngine } from "@dendronhq/engine-server";
import yargs from "yargs";
import { BackfillCliOpts, BackfillCommand } from "../src/commands/backfill";

yargs
  .command<BackfillCliOpts>(
    "backfill",
    "backfill frontmatter",
    args => {
      args.option("vault", {
        describe: "location of vault"
      });
    },
    async args => {
      const { vault } = args;
      const cmd = new BackfillCommand();
      const engine = DendronEngine.getOrCreateEngine({ root: vault });
      await engine.init();
      await cmd.execute({ engine });
    }
  )
  .demandCommand(1)
  .help().argv;
