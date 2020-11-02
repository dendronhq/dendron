import _ from "lodash";
import { Logger } from "../logger";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";
import { OpenLogsCommand } from "./OpenLogs";

type CommandOpts = {};

type CommandOutput = void;

export class DumpStateCommand extends BasicCommand<CommandOpts, CommandOutput> {
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute() {
    const ctx = "DumpStateCommand";
    const engine = DendronWorkspace.instance().getEngine();
    const notes = _.mapValues(engine.notes, (val) => _.omit(val, "body"));
    const schemas = engine.schemas;
    Logger.info({ ctx, notes, schemas });
    await new OpenLogsCommand().execute();
  }
}
