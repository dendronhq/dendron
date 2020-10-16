import { BaseCommand } from "./base";
import _ from "lodash";
import { DEngineClientV2, DNode } from "@dendronhq/common-all";

type CommandOpts = { engine: DEngineClientV2 } & CommonOpts;

type CommonOpts = {
  overwriteFields?: string[];
};

type CommandOutput = void;

export class BackfillV2Command extends BaseCommand<CommandOpts, CommandOutput> {
  async execute(opts: CommandOpts) {
    const { engine, overwriteFields } = _.defaults(opts, {
      overwriteFields: [],
    });
    await Promise.all(
      _.values(engine.notes).map((n) => {
        overwriteFields.forEach((f) => {
          if (f === "title") {
            n.title = DNode.defaultTitle(n.fname);
          } else {
            throw Error(`unknown overwrite field: ${f}`);
          }
        });
        return engine.writeNote(n);
      })
    );
    return;
  }
}
