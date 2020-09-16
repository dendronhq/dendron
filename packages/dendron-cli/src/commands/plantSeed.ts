import yargs from "yargs";
import { SoilCommand, SoilCommandCLIOpts, SoilCommandOpts } from "./soil";

type CLIOpts = SoilCommandCLIOpts & {
  id: string;
};

type CommandOpts = SoilCommandOpts & {
  id: string;
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
    const opts = super.enrichArgs(args);
    return { ...opts, id: args.id };
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
    const SeedClass = require(opts.id);
    console.log(SeedClass);
  }
}
