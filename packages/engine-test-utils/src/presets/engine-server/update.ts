import { NoteProps, NoteUtils } from "@dendronhq/common-all";
import {
  TestPresetEntryV4,
  NOTE_PRESETS_V4,
} from "@dendronhq/common-test-utils";
import _ from "lodash";

const NOTES = {
  NOTE_NO_CHILDREN: new TestPresetEntryV4(
    async ({ vaults, engine }) => {
      const noteOld = NoteUtils.getNoteByFnameV5({
        fname: "foo",
        notes: engine.notes,
        vault: vaults[0],
        wsRoot: engine.wsRoot,
      }) as NoteProps;
      const cnote = _.clone(noteOld);
      cnote.body = "new body";
      await engine.updateNote(cnote);
      const noteNew = NoteUtils.getNoteByFnameV5({
        fname: "foo",
        notes: engine.notes,
        vault: vaults[0],
        wsRoot: engine.wsRoot,
      }) as NoteProps;

      return [
        {
          actual: _.trim(noteOld.body),
          expected: "foo body",
        },
        {
          actual: _.trim(noteNew.body),
          expected: "new body",
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
