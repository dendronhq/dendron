import { NoteUtils } from "@dendronhq/common-all";
import {
  TestPresetEntryV4,
  NOTE_PRESETS_V4,
} from "@dendronhq/common-test-utils";
import _ from "lodash";

const SCHEMAS = {};
const NOTES = {
  /**
   * Check that we can get both roots from both vaults
   */
  REGULAR: new TestPresetEntryV4(
    async ({ vaults, engine }) => {
      const note = NoteUtils.getNoteByFnameFromEngine({
        fname: NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_TARGET.fname,
        engine,
        vault: vaults[0],
      });

      const { data } = await engine.getAnchors({
        note: note!,
      });
      return [
        {
          actual: data,
          expected: {
            "^8a": {
              column: 5,
              line: 8,
              type: "block",
              value: "8a",
            },
            h1: {
              column: 0,
              line: 7,
              depth: 1,
              text: "H1",
              type: "header",
              value: "h1",
            },
            h2: {
              column: 0,
              line: 8,
              depth: 1,
              text: "H2",
              type: "header",
              value: "h2",
            },
            h3: {
              column: 0,
              line: 9,
              depth: 1,
              text: "H3",
              type: "header",
              value: "h3",
            },
          },
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_TARGET.create({
          wsRoot,
          vault: vaults[0],
        });
      },
    }
  ),
};
export const ENGINE_GET_ANCHORS_PRESETS = {
  NOTES,
  SCHEMAS,
};
