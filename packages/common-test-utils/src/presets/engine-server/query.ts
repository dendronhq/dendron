import { DNodeUtilsV2, NotePropsV2, NoteUtilsV2 } from "@dendronhq/common-all";
import _ from "lodash";
import { NoteTestUtilsV4 } from "../../noteUtils";
import { PreSetupHookFunction } from "../../types";
import { TestPresetEntryV4 } from "../../utilsv2";
import { NOTE_PRESETS_V4, SCHEMA_PRESETS_V4 } from "../notes";

const setupBasic: PreSetupHookFunction = async ({ vaults, wsRoot }) => {
  const vault = vaults[0];
  await NOTE_PRESETS_V4.NOTE_SIMPLE.create({
    vault,
    wsRoot,
  });
  await NOTE_PRESETS_V4.NOTE_SIMPLE_CHILD.create({
    vault,
    wsRoot,
  });
  await NOTE_PRESETS_V4.NOTE_SIMPLE_OTHER.create({
    vault,
    wsRoot,
  });
  await SCHEMA_PRESETS_V4.SCHEMA_SIMPLE.create({ vault, wsRoot });
};

const NOTES = {
  EMPTY_QS: new TestPresetEntryV4(
    async ({ vaults, engine }) => {
      const vault = vaults[0];
      const notes = engine.notes;
      const { data } = await engine.queryNotes({ qs: "", vault });
      const expectedNote = NoteUtilsV2.getNoteByFnameV4({
        fname: "root",
        notes,
        vault,
      });
      return [
        {
          actual: data[0],
          expected: expectedNote,
        },
      ];
    },
    {
      preSetupHook: setupBasic,
    }
  ),
  STAR_QUERY: new TestPresetEntryV4(
    async ({ vaults, engine }) => {
      const vault = vaults[0];
      const { data } = await engine.queryNotes({ qs: "*", vault });
      return [
        {
          actual: data.length,
          expected: 5,
        },
      ];
    },
    {
      preSetupHook: setupBasic,
    }
  ),
  DOMAIN_QUERY_WITH_SCHEMA: new TestPresetEntryV4(
    async ({ vaults, engine }) => {
      const vault = vaults[0];
      const notes = engine.notes;
      const fname = NOTE_PRESETS_V4.NOTE_SIMPLE.fname;
      const { data } = await engine.queryNotes({ qs: fname, vault });
      const expectedNote = NoteUtilsV2.getNoteByFnameV4({
        fname,
        notes,
        vault,
      });
      return [
        {
          actual: data[0],
          expected: expectedNote,
        },
        {
          actual: data[0].schema,
          expected: {
            moduleId: SCHEMA_PRESETS_V4.SCHEMA_SIMPLE.fname,
            schemaId: SCHEMA_PRESETS_V4.SCHEMA_SIMPLE.fname,
          },
        },
      ];
    },
    {
      preSetupHook: setupBasic,
    }
  ),
  CHILD_QUERY_WITH_SCHEMA: new TestPresetEntryV4(
    async ({ vaults, engine }) => {
      const vault = vaults[0];
      const notes = engine.notes;
      const fname = NOTE_PRESETS_V4.NOTE_SIMPLE_CHILD.fname;
      const { data } = await engine.queryNotes({ qs: fname, vault });
      const expectedNote = NoteUtilsV2.getNoteByFnameV4({
        fname,
        notes,
        vault,
      });
      return [
        {
          actual: data[0],
          expected: expectedNote,
        },
        {
          actual: data[0].schema,
          expected: {
            moduleId: SCHEMA_PRESETS_V4.SCHEMA_SIMPLE.fname,
            schemaId: DNodeUtilsV2.basename(
              NOTE_PRESETS_V4.NOTE_SIMPLE_CHILD.fname
            ),
          },
        },
      ];
    },
    {
      preSetupHook: setupBasic,
    }
  ),
};
export const ENGINE_QUERY_PRESETS = {
  NOTES,
};
