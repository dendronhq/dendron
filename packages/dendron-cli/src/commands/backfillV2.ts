import {
  DEngineClient,
  genUUID,
  NoteProps,
  NotePropsDict,
  NoteUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { BaseCommand } from "./base";

type CommandOpts = {
  engine: DEngineClient;
  note?: NoteProps;
} & CommonOpts;

type CommonOpts = {
  overwriteFields?: string[];
};

type CommandOutput = void;

export class BackfillV2Command extends BaseCommand<CommandOpts, CommandOutput> {
  async execute(opts: CommandOpts) {
    const { engine, note, overwriteFields } = _.defaults(opts, {
      overwriteFields: [],
    });
    const candidates: NotePropsDict = _.isUndefined(note)
      ? engine.notes
      : { [note.id]: note };
    const notes = await Promise.all(
      _.values(candidates)
        .filter((n) => !n.stub)
        .map(async (n) => {
          overwriteFields.forEach((f) => {
            if (f === "title") {
              n.title = NoteUtils.genTitle(n.fname);
            } else if (f === "id") {
              // ids starting or ending with `-` or `_` break pages in Github publishing
              if (n.id.match(/^[-_]|[-_]$/)) {
                n.id = genUUID();
              }
            } else {
              throw Error(`unknown overwrite field: ${f}`);
            }
          });
          return n;
        })
    );
    // @ts-ignore
    await engine.store.bulkAddNotes({ notes });
    return;
  }
}
