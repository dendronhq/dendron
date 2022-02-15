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
        fname: NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.fname,
        engine,
        vault: vaults[0],
      });

      const { data } = await engine.getLinks({
        note: note!,
        type: "regular",
      });
      return [
        {
          actual: data?.length,
          expected: 1,
        },
        {
          actual: data![0].from.fname,
          expected: "beta",
        },
        {
          actual: data![0].to!.fname,
          expected: "alpha",
        },
        {
          actual: data![0].type,
          expected: "wiki",
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_TARGET.create({
          wsRoot,
          vault: vaults[0],
        });
        await NOTE_PRESETS_V4.NOTE_WITH_ANCHOR_LINK.create({
          wsRoot,
          vault: vaults[0],
        });
      },
    }
  ),
  BACKLINK_CANDIDATES: new TestPresetEntryV4(
    async ({ vaults, engine }) => {
      const note = NoteUtils.getNoteByFnameFromEngine({
        fname: NOTE_PRESETS_V4.NOTE_WITH_LINK_CANDIDATE_TARGET.fname,
        engine,
        vault: vaults[0],
      });

      const { data } = await engine.getLinks({
        note: note!,
        type: "candidate",
      });
      return [
        {
          actual: data?.length,
          expected: 1,
        },
        {
          actual: data![0].from.fname,
          expected: "gamma",
        },
        {
          actual: data![0].to!.fname,
          expected: "alpha",
        },
        {
          actual: data![0].type,
          expected: "linkCandidate",
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
          wsRoot,
          vault: vaults[0],
        });
        await NOTE_PRESETS_V4.NOTE_WITH_LINK_CANDIDATE_TARGET.create({
          wsRoot,
          vault: vaults[0],
        });
      },
    }
  ),
};
export const ENGINE_GET_LINKS_PRESETS = {
  NOTES,
  SCHEMAS,
};
