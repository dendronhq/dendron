import { BaseCommand } from "./base";
import _ from "lodash";
import { DEngine, DNode } from "@dendronhq/common-all";

type CommandOpts = { engine: DEngine } & CommonOpts;

type CommonOpts = {
  overwriteFields?: string[];
};

type CommandOutput = void;

export class BackfillCommand extends BaseCommand<CommandOpts, CommandOutput> {
  async execute(opts: CommandOpts) {
    const { engine, overwriteFields } = _.defaults(opts, {
      overwriteFields: []
    });
    await Promise.all(
      _.values(engine.notes).map(n => {
        overwriteFields.forEach(f => {
          if (f === "title") {
            n.title = DNode.defaultTitle(n.fname);
          } else {
            throw Error(`unknown overwrite field: ${f}`);
          }
          return engine.write(n);
        });
      })
    );
    return;
  }
}

export type BackfillCliOpts = {
  vault: string;
} & CommonOpts;
