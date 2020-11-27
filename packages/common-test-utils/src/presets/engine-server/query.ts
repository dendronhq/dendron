import {
  DNodeUtilsV2,
  NoteUtilsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import { match } from "assert";
import _ from "lodash";
import { TestPresetEntryV4 } from "../../utilsv2";
import { NOTE_PRESETS_V4 } from "../notes";
import { SCHEMA_PRESETS_V4 } from "../schemas";
import { setupBasic } from "./utils";

const SCHEMAS = {
  EMPTY_QS: new TestPresetEntryV4(
    async ({ vaults, engine }) => {
      const vault = vaults[0];
      const schemas = engine.schemas;
      const { data } = await engine.querySchema("");
      const expectedNote = SchemaUtilsV2.getSchemaModuleByFnameV4({
        fname: "root",
        schemas,
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
    async ({ engine }) => {
      const { data } = await engine.querySchema("*");
      return [
        {
          actual: data.length,
          expected: 2,
        },
      ];
    },
    {
      preSetupHook: setupBasic,
    }
  ),
  SIMPLE: new TestPresetEntryV4(
    async ({ engine, vaults }) => {
      const schemas = engine.schemas;
      const vault = vaults[0];
      const sid = SCHEMA_PRESETS_V4.SCHEMA_SIMPLE.fname;
      const { data } = await engine.querySchema(sid);
      const expectedSchema = SchemaUtilsV2.getSchemaModuleByFnameV4({
        fname: sid,
        schemas,
        vault,
      });
      return [
        {
          actual: data[0],
          expected: expectedSchema,
        },
      ];
    },
    {
      preSetupHook: setupBasic,
    }
  ),
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
      const matchNote = _.find(data, { id: expectedNote?.id });
      return [
        {
          actual: matchNote,
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
          expected: 4,
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
      const matchNote = _.find(data, { id: expectedNote?.id });
      return [
        {
          actual: matchNote,
          expected: expectedNote,
        },
        {
          actual: matchNote?.schema,
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
  SCHEMAS,
};
