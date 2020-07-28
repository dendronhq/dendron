import { BaseCommand } from "./base";
import _ from "lodash";
import { DEngine } from "@dendronhq/common-all";

type CommandOpts = { engine: DEngine };


type CommandOutput = void;

export class BackfillCommand extends BaseCommand<
  CommandOpts,
  CommandOutput
> {
  async execute(opts: CommandOpts) {
    const { engine } = _.defaults(opts, {});
    await Promise.all(
      _.values(engine.notes).map(n => {
        return engine.write(n);
      })
    );
    return;
  }
}

export type BackfillCliOpts = {
  vault: string;
};
