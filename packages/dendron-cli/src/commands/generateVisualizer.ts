import { generateSVG, InputArgs } from "@dendronhq/dendron-viz/lib";
import { Argv } from "yargs";
import { CLICommand } from "./base";

export class VisualizeCLICommand extends CLICommand {
  constructor() {
    super({
      name: "visualize",
      desc: "generates a fingerprint visualization of Dendron workspace",
    });
  }

  buildArgs(args: Argv) {
    super.buildArgs(args);
    args.option("out", { description: "path to the output file " });
  }

  async enrichArgs(args: any) {
    return { data: args };
  }

  async execute(opts: InputArgs) {
    await generateSVG(opts);
    return {};
  }
}
