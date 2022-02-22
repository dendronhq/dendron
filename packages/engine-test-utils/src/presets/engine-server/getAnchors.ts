import { NoteUtils } from "@dendronhq/common-all";
import {
  TestPresetEntryV4,
  NOTE_PRESETS_V4,
  NoteTestUtilsV4,
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
  /** Test for cases where there are headers that have markdown in them, like
   * code blocks or wikilinks. Make sure the correct text is extracted, which is
   * important because the text will be displayed to the user in the ToC when
   * published.
   */
  HEADERS_WITH_MARKDOWN: new TestPresetEntryV4(
    async ({ vaults, engine }) => {
      const note = NoteUtils.getNoteByFnameFromEngine({
        fname: "test",
        engine,
        vault: vaults[0],
      });

      const { data } = await engine.getAnchors({
        note: note!,
      });
      return [
        {
          actual: Object.entries(data!).map(([_key, anchor]) => anchor.text),
          expected: ["root", "alias", "code", "@user", "#tag"],
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NoteTestUtilsV4.createNote({
          fname: "test",
          vault: vaults[0],
          wsRoot,
          body: [
            "## [[root]]",
            "## [[alias|root]]",
            "## `code`",
            "## @user",
            "## #tag",
          ].join("\n"),
        });
      },
    }
  ),
};
export const ENGINE_GET_ANCHORS_PRESETS = {
  NOTES,
  SCHEMAS,
};
