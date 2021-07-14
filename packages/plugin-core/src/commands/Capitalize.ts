import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";

export class CapitalizeCommand extends BasicCommand<void, void> {
    key = DENDRON_COMMANDS.CAPITALIZE.key;
    execute(opts: void): Promise<void> {
        throw new Error("Method not implemented.");
    }

}