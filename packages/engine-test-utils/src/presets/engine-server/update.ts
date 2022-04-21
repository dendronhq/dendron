import { NoteProps, NoteUtils } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import {
  TestPresetEntryV4,
  NOTE_PRESETS_V4,
} from "@dendronhq/common-test-utils";
import { readNotesFromCache } from "@dendronhq/engine-server";
import _ from "lodash";

const NOTES = {
  NOTE_NO_CHILDREN: new TestPresetEntryV4(
    async ({ vaults, wsRoot, engine }) => {
      const vault = vaults[0];
      const cacheVault = readNotesFromCache(vault2Path({ wsRoot, vault }));
      const noteOld = NoteUtils.getNoteByFnameFromEngine({
        fname: "foo",
        engine,
        vault,
      }) as NoteProps;
      const cnote = _.clone(noteOld);
      cnote.body = "new body";
      await engine.updateNote(cnote);
      const noteNew = NoteUtils.getNoteByFnameFromEngine({
        fname: "foo",
        engine,
        vault,
      }) as NoteProps;
      await engine.init();

      return [
        {
          actual: _.trim(noteOld.body),
          expected: "foo body",
        },
        {
          actual: _.trim(noteNew.body),
          expected: "new body",
        },
        {
          actual: _.size(cacheVault.notes),
          expected: 2,
        },
        {
          actual: _.size(
            readNotesFromCache(vault2Path({ wsRoot, vault })).notes
          ),
          expected: 2,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NOTE_PRESETS_V4.NOTE_SIMPLE.create({ wsRoot, vault: vaults[0] });
      },
    }
  ),
};
export const ENGINE_UPDATE_PRESETS = {
  NOTES,
};
