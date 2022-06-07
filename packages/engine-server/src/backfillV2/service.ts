import {
  DEngineClient,
  genUUID,
  NoteProps,
  NotePropsByIdDict,
  NoteUtils,
} from "@dendronhq/common-all";
import _ from "lodash";

type BackfillServiceOpts = {
  engine: DEngineClient;
  note?: NoteProps;
  overwriteFields?: string[] | undefined;
};

export class BackfillService {
  async updateNotes(opts: BackfillServiceOpts) {
    const { engine, note, overwriteFields } = _.defaults(opts, {
      overwriteFields: [],
    });
    const candidates: NotePropsByIdDict = _.isUndefined(note)
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
    await engine.bulkWriteNotes({ notes });
    return {};
  }
}
