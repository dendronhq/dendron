import {
  TestPresetEntryV4,
  NOTE_PRESETS_V4,
} from "@dendronhq/common-test-utils";

const SCHEMAS = {};
const NOTES = {
  /**
   * Check that we can get both roots from both vaults
   */
  ROOT: new TestPresetEntryV4(async ({ vaults, engine }) => {
    const vault = vaults[0];
    const vault2 = vaults[1];
    const root = (
      await engine.findNotes({
        fname: "root",
        vault,
      })
    )[0];
    const root2 = (
      await engine.findNotes({
        fname: "root",
        vault: vault2,
      })
    )[0];
    const { data } = await engine.getNoteByPath({ npath: "root", vault });
    const { data: data2 } = await engine.getNoteByPath({
      npath: "root",
      vault: vault2,
    });
    return [
      {
        actual: data?.changed,
        expected: [],
      },
      {
        actual: data?.note,
        expected: root,
      },
      {
        actual: data2?.note,
        expected: root2,
      },
    ];
  }),
  EXISTING_NOTE: new TestPresetEntryV4(
    async ({ vaults, engine }) => {
      const vault = vaults[0];
      const note = (
        await engine.findNotes({
          fname: "foo",
          vault,
        })
      )[0];
      const { data } = await engine.getNoteByPath({ npath: "foo", vault });
      return [
        {
          actual: data?.changed,
          expected: [],
        },
        {
          actual: data?.note,
          expected: note,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        await NOTE_PRESETS_V4.NOTE_SIMPLE.create({ vault, wsRoot });
      },
    }
  ),
  NOTE_WITH_CAPS_AND_SPACES: new TestPresetEntryV4(
    async ({ vaults, engine }) => {
      const vault = vaults[0];
      const note = (
        await engine.findNotes({
          fname: "000 Index",
          vault,
        })
      )[0];
      const { data } = await engine.getNoteByPath({
        npath: "000 Index",
        vault,
      });
      return [
        {
          actual: data?.changed,
          expected: [],
        },
        {
          actual: data?.note,
          expected: note,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        await NOTE_PRESETS_V4.NOTE_WITH_CAPS_AND_SPACE.create({
          vault,
          wsRoot,
        });
      },
    }
  ),
};
export const ENGINE_GET_NOTE_BY_PATH_PRESETS = {
  NOTES,
  SCHEMAS,
};
