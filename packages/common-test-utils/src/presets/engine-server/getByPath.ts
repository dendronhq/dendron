import { NoteUtils } from "@dendronhq/common-all";
import { TestPresetEntryV4 } from "../../utilsv2";
import { NOTE_PRESETS_V4 } from "../notes";

const SCHEMAS = {};
const NOTES = {
  /**
   * Check that we can get both roots from both vaults
   */
  ROOT: new TestPresetEntryV4(async ({ vaults, engine, wsRoot }) => {
    const vault = vaults[0];
    const vault2 = vaults[1];
    const root = NoteUtils.getNoteByFnameV5({
      fname: "root",
      notes: engine.notes,
      vault,
      wsRoot,
    });
    const root2 = NoteUtils.getNoteByFnameV5({
      fname: "root",
      notes: engine.notes,
      vault: vault2,
      wsRoot,
    });
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
      const note = NoteUtils.getNoteByFnameV5({
        fname: "foo",
        notes: engine.notes,
        vault,
        wsRoot: engine.wsRoot,
      });
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
      const note = NoteUtils.getNoteByFnameV5({
        fname: "000 Index",
        notes: engine.notes,
        vault,
        wsRoot: engine.wsRoot,
      });
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
  NEW_NOTE: new TestPresetEntryV4(async ({ vaults, engine }) => {
    const vault = vaults[0];
    const { data } = await engine.getNoteByPath({
      npath: "bar",
      vault,
      createIfNew: true,
    });
    return [
      {
        actual: data?.changed.map((ent) => ({
          fname: ent.note.fname,
          status: ent.status,
        })),
        expected: [
          { fname: "root", status: "update" },
          { fname: "bar", status: "create" },
        ],
      },
      {
        actual: data?.note?.fname,
        expected: "bar",
      },
    ];
  }),
  NEW_NOTE_WITH_OVERRIDES: new TestPresetEntryV4(async ({ vaults, engine }) => {
    const vault = vaults[0];
    const { data } = await engine.getNoteByPath({
      npath: "bar",
      vault,
      createIfNew: true,
      overrides: {
        title: "bar title",
      },
    });
    return [
      {
        actual: data?.changed.map((ent) => ({
          fname: ent.note.fname,
          status: ent.status,
        })),
        expected: [
          { fname: "root", status: "update" },
          { fname: "bar", status: "create" },
        ],
      },
      {
        actual: data?.note?.fname,
        expected: "bar",
      },
      {
        actual: data?.note?.title,
        expected: "bar title",
      },
    ];
  }),
};
export const ENGINE_GET_NOTE_BY_PATH_PRESETS = {
  NOTES,
  SCHEMAS,
};
