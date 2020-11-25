import { NotePropsV2, NoteUtilsV2 } from "@dendronhq/common-all";
import { FileTestUtils } from "../../fileUtils";
import { TestPresetEntryV4 } from "../../utilsv2";
import { NOTE_PRESETS_V4 } from "../notes";

const NOTES = {
  DOMAIN_STUB: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const noteRoot = NoteUtilsV2.getNoteByFnameV4({
        fname: "root",
        notes: engine.notes,
        vault: vaults[0],
      }) as NotePropsV2;

      const noteChild = NoteUtilsV2.getNoteByFnameV4({
        fname: "foo",
        notes: engine.notes,
        vault: vaults[0],
      }) as NotePropsV2;
      const checkVault = await FileTestUtils.assertInVault({
        wsRoot,
        vault: vaults[0],
        match: ["foo.ch1.md"],
        nomatch: ["foo.md"],
      });
      return [
        {
          actual: noteRoot.children,
          expected: [noteChild.id],
        },
        {
          actual: checkVault,
          expected: true,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NOTE_PRESETS_V4.NOTE_SIMPLE_CHILD({ wsRoot, vault: vaults[0] });
      },
    }
  ),
};
export const ENGINE_INIT_PRESETS = {
  NOTES,
};
