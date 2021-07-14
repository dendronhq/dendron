import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";

type CommandOpts = {};
type CommandOutput = string;

export class CapitalizeCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CAPITALIZE.key;
  async execute(_: CommandOpts) {
    return "wrong value";
  }
}
