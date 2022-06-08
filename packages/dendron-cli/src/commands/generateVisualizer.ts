import { RespV3 } from "@dendronhq/common-all";
import yargs from "yargs";
import { CLICommand } from "./base";

type CommandOpts = {};

type CommandOutput = {};

export class VisualizeCLICommand extends CLICommand<
  CommandOpts,
  CommandOutput
> {
  constructor() {
    super({
      name: "visualize",
      desc: "generates a fingerprint visualization of Dendron workspace",
    });
  }

  async enrichArgs(args: any): Promise<RespV3<CommandOpts>> {
    return { data: args };
  }

  async execute(opts?: CommandOpts): Promise<CommandOutput> {
    console.log("Hello World");
    return {};
  }
}
