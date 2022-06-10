import { RespV3 } from "@dendronhq/common-all";
import { sayHello } from "@dendronhq/dendron-viz/lib";
import { CommandCommonProps } from "./base";
import { CLICommand } from "./base";

type CommandOpts = CommandCommonProps & {
  random: string;
};

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
    console.log(opts);
    sayHello();
    return {};
  }
}
