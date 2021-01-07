import { DEngineClientV2 } from "@dendronhq/common-all";
import _ from "lodash";
import yargs from "yargs";
import { CLICommand } from "./base";
import { setupEngine, setupEngineArgs } from "./utils";

type FilterRule = {
  key: string;
  value: string;
  operator: "in";
};
type CommandCLIOpts = {
  wsRoot: string;
  enginePort?: number;
  action: NoteActions;
  query?: string;
  limit?: number;
  dryRun?: boolean;
  filter?: string[];
};

type CommandOpts = CommandCLIOpts & {
  engine: DEngineClientV2;
  filters: FilterRule[];
};
type CommandOutput = void;

export enum NoteActions {
  QUERY = "query",
}

function constructFilters(filter?: string[]): FilterRule[] {
  console.log(filter);
  return [];
}

export class NoteCLICommand extends CLICommand<CommandOpts, CommandOutput> {
  constructor() {
    super({ name: "note", desc: "note related command" });
  }

  buildArgs(args: yargs.Argv) {
    super.buildArgs(args);
    setupEngineArgs(args);
    args.option("action", {
      describe: "what action to perform on notes",
      type: "string",
      requiresArg: true,
      choices: Object.values(NoteActions),
    });
    args.option("query", {
      describe: "run doctor over a query",
      type: "string",
    });
    args.option("limit", {
      describe: "limit num changes",
      type: "number",
    });
    args.option("dryRun", {
      describe: "dry run",
      type: "boolean",
    });
    args.option("filter", {
      describe: "filter operations",
      type: "array",
    });
  }

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    const engineArgs = await setupEngine(args);
    const filters = constructFilters(args.filter);
    return { ...args, ...engineArgs, filters };
  }

  async execute(opts: CommandOpts) {
    const { action, engine, query } = _.defaults(opts, {
      limit: 99999,
      exit: true,
    });
    switch (action) {
      case NoteActions.QUERY: {
        let notes = query
          ? engine.queryNotesSync({ qs: query }).data
          : _.values(engine.notes);
        console.log(JSON.stringify(notes));
        break;
      }
    }
  }
}
