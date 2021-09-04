import _ from "lodash";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { getDWorkspace } from "../workspace";
import { BasicCommand } from "./base";
import { OpenLogsCommand } from "./OpenLogs";

type CommandOpts = {};

type CommandOutput = void;

export class DumpStateCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.DUMP_STATE.key;
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute() {
    const ctx = "DumpStateCommand";
    const { engine } = getDWorkspace();
    const notes = _.mapValues(engine.notes, (val) => _.omit(val, "body"));
    const schemas = engine.schemas;
    Logger.info({ ctx, notes, schemas });
    await new OpenLogsCommand().execute();
  }
}
