import { generateSVG, InputArgs } from "@dendronhq/dendron-viz";
import { Argv } from "yargs";
import { CLICommand, CommandCommonProps } from "./base";
import { setupEngine, setupEngineArgs, SetupEngineResp } from "./utils";

type CommandOpts = InputArgs & SetupEngineResp & CommandCommonProps;

export { CommandOpts as VisualizeCLICommandOpts };

export class VisualizeCLICommand extends CLICommand {
  constructor() {
    super({
      name: "visualize",
      desc: "generates a fingerprint visualization of Dendron workspace",
    });
  }

  buildArgs(args: Argv) {
    super.buildArgs(args);
    setupEngineArgs(args);
    args.option("out", { description: "path to the output file " });
  }

  async enrichArgs(args: any) {
    /* Instantiate an engine and pass it to the execute method as part of the argument */
    const engineArgs = await setupEngine(args);
    return { data: { ...args, ...engineArgs } };
  }

  async execute(opts: CommandOpts) {
    await generateSVG(opts);
    return {};
  }
}
