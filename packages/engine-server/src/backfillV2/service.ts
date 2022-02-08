import {
  DEngineClient,
  genUUID,
  NoteChangeEntry,
  NoteProps,
  NotePropsDict,
  NoteUtils,
} from "@dendronhq/common-all";
import _ from "lodash";

type BackfillServiceOpts = {
  engine: DEngineClient;
  note?: NoteProps;
  overwriteFields?: string[] | undefined;
  dryRun?: boolean;
};

export class BackfillService {
  async updateNotes(opts: BackfillServiceOpts) {
    const { engine, note, overwriteFields } = _.defaults(opts, {
      overwriteFields: [],
    });
    const candidates: NotePropsDict = _.isUndefined(note)
      ? engine.notes
      : { [note.id]: note };
    const changed: NoteChangeEntry[] = [];
    await Promise.all(
      _.values(candidates)
        .filter((n) => !n.stub)
        .map(async (n) => {
          let updated = false;
          const prevNote = { ...n };
          overwriteFields.forEach((f) => {
            if (f === "title") {
              n.title = NoteUtils.genTitle(n.fname);
              updated = true;
            } else if (f === "id") {
              updated = true;
              // ids starting or ending with `-` or `_` break pages in Github publishing
              if (n.id.match(/^[-_]|[-_]$/)) {
                n.id = genUUID();
              }
            } else {
              throw Error(`unknown overwrite field: ${f}`);
            }
          });
          if (updated) {
            changed.push({ note: n, status: "update", prevNote });
          }
          return n;
        })
    );
    if (!opts.dryRun) {
      await engine.bulkAddNotes({ notes: changed.map((n) => n.note) });
    }
    return changed;
  }
}
