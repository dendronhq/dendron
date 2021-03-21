import { NoteUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { TestPresetEntryV4 } from "../../utilsv2";

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
    await engine.bulkAddNotes({ notes: [note1, note2] });
    return [
      {
        actual: _.size(engine.notes),
        expected: orig + 2,
        msg: "should be 2 more notes",
      },
      {
        expected: engine.notes["bar1"],
        actual: note1,
      },
    ];
  }),
};
export const ENGINE_BULK_ADD_NOTES_PRESETS = {
  NOTES,
  SCHEMAS,
};
