import path from "path";
import yargs from "yargs";
import { SoilCommand, SoilCommandCLIOpts, SoilCommandOpts } from "./soil";

type CLIOpts = SoilCommandCLIOpts & {
  id: string;
};

type CommandOpts = SoilCommandOpts & {
  id: string;
  roots: string[];
};

export class PlantSeedCommand extends SoilCommand<CLIOpts, CommandOpts> {
  buildArgs(args: yargs.Argv) {
    super.buildArgs(args);
    args.option("id", {
      describe: "id of seed",
      demandOption: true,
    });
  }

  enrichArgs(args: CLIOpts) {
    const opts = super._enrichArgs(args);
    return { ...opts, roots: [args.vault], id: args.id };
  }

  eval = (args: CLIOpts) => {
    const opts = this.enrichArgs(args);
    this.execute(opts);
  };

  static buildCmd(yargs: yargs.Argv): yargs.Argv {
    const _cmd = new PlantSeedCommand();
    return yargs.command(
      "plantSeed",
      "plant a seed",
      _cmd.buildArgs,
      _cmd.eval
    );
  }

  async execute(opts: CommandOpts) {
    const { roots, wsRoot } = opts;
    const node_modules = path.join(opts.wsRoot, "node_modules");
    const SeedClass = require(path.join(node_modules, opts.id)).default;
    const seed = new SeedClass({ name: SeedClass.name, roots, wsRoot });
    await seed.plant();
    return;
  }
}
