import yargs from "yargs";
import { CommandOptsV3, SoilCommandV3 } from "./soil";
import { setupEngine } from "./utils";

type CommandCLIOpts = {
  wsRoot: string;
};
type CommandOpts = CommandOptsV3;
type CommandOutput = void;

export class DoctorCommand extends SoilCommandV3<
  CommandCLIOpts,
  CommandOpts,
  CommandOutput
> {
  static buildCmd(yargs: yargs.Argv): yargs.Argv {
    const _cmd = new DoctorCommand();
    return yargs.command(
      "doctor",
      "run doctor command",
      _cmd.buildArgs,
      _cmd.eval
    );
  }

  buildArgs(args: yargs.Argv) {
    super.buildArgs(args);
    args.option("actions", {
      describe: "what actions the doctor should take",
      requiresArg: true,
      type: "array",
      choices: ["h1ToTitle", "otherAction"],
    });
  }

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    const engineArgs = await setupEngine(args);
    return { ...args, ...engineArgs };
  }

  async execute(opts: CommandOpts) {
    return;
  }
}
