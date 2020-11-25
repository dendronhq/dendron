import { NotePropsV2, NoteUtilsV2 } from "@dendronhq/common-all";
import _ from "lodash";
import { TestPresetEntryV4 } from "../../utilsv2";
import { NOTE_PRESETS_V4 } from "../notes";

const NOTES = {
  NOTE_NO_CHILDREN: new TestPresetEntryV4(
    async ({ vaults, engine }) => {
      const noteOld = NoteUtilsV2.getNoteByFnameV4({
        fname: "foo",
        notes: engine.notes,
        vault: vaults[0],
      }) as NotePropsV2;
      const cnote = _.clone(noteOld);
      cnote.body = "new body";
      await engine.updateNote(cnote);
      const noteNew = NoteUtilsV2.getNoteByFnameV4({
        fname: "foo",
        notes: engine.notes,
        vault: vaults[0],
      }) as NotePropsV2;

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
        await NOTE_PRESETS_V4.NOTE_SIMPLE({ wsRoot, vault: vaults[0] });
      },
    }
  ),
};
export const ENGINE_UPDATE_PRESETS = {
  NOTES,
};
