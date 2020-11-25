import { NoteUtilsV2 } from "@dendronhq/common-all";
import { TestPresetEntryV4 } from "../../utilsv2";
import { NOTE_PRESETS_V4 } from "../notes";

const NOTES = {
  ROOT: new TestPresetEntryV4(async ({ vaults, engine }) => {
    const vault = vaults[0];
    const root = NoteUtilsV2.getNoteByFnameV4({
      fname: "root",
      notes: engine.notes,
      vault,
    });
    const { data } = await engine.getNoteByPath({ npath: "root", vault });
    return [
      {
        actual: data?.changed,
        expected: [],
      },
      {
        actual: data?.note,
        expected: root,
      },
    ];
  }),
  EXISTING_NOTE: new TestPresetEntryV4(
    async ({ vaults, engine }) => {
      const vault = vaults[0];
      const note = NoteUtilsV2.getNoteByFnameV4({
        fname: "foo",
        notes: engine.notes,
        vault,
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
      const note = NoteUtilsV2.getNoteByFnameV4({
        fname: "000 Index",
        notes: engine.notes,
        vault,
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
};
export const ENGINE_GET_NOTE_BY_PATH_PRESETS = {
  NOTES,
};
