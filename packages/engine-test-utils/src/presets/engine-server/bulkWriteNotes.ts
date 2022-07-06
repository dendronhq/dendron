import { NoteUtils } from "@dendronhq/common-all";
import { TestPresetEntryV4 } from "@dendronhq/common-test-utils";
import _ from "lodash";

const SCHEMAS = {};
const NOTES = {
  BASIC: new TestPresetEntryV4(async ({ vaults, engine }) => {
    const vault = vaults[0];
    const orig = _.size(engine.notes);
    const note1 = NoteUtils.create({
      id: "bar1",
      fname: "bar1",
      created: 1,
      updated: 1,
      vault,
    });
    const note2 = NoteUtils.create({
      id: "bar2",
      fname: "bar2",
      created: 1,
      updated: 1,
      vault,
    });
    const rootNote = (await engine.findNotes({ fname: "root", vault }))[0];
    await engine.bulkWriteNotes({ notes: [note1, note2] });
    const barNote = (await engine.getNote("bar1"))!;
    return [
      {
        actual: _.size(engine.notes),
        expected: orig + 2,
        msg: "should be 2 more notes",
      },
      {
        expected: barNote.id,
        actual: note1.id,
      },
      {
        expected: barNote.fname,
        actual: note1.fname,
      },
      {
        expected: barNote.vault,
        actual: note1.vault,
      },
      {
        expected: barNote.parent,
        actual: rootNote.id,
      },
    ];
  }),
};
export const ENGINE_BULK_WRITE_NOTES_PRESETS = {
  NOTES,
  SCHEMAS,
};
