import { DNodeUtils } from "@dendronhq/common-all";
import {
  TestPresetEntryV4,
  SCHEMA_PRESETS_V4,
  NOTE_PRESETS_V4,
} from "@dendronhq/common-test-utils";
import _ from "lodash";
import { setupBasic, setupEmpty } from "./utils";

const SCHEMAS = {
  STAR_QUERY: new TestPresetEntryV4(
    async ({ engine }) => {
      const { data } = await engine.querySchema("*");
      return [
        {
          actual: data!.length,
          expected: 2,
        },
      ];
    },
    {
      preSetupHook: setupBasic,
    }
  ),
  SIMPLE: new TestPresetEntryV4(
    async ({ engine }) => {
      const sid = SCHEMA_PRESETS_V4.SCHEMA_SIMPLE.fname;
      const { data } = await engine.querySchema(sid);
      const expectedSchema = (await engine.getSchema(sid)).data!;
      const fooSchema = _.find(data, { fname: sid });
      return [
        {
          actual: fooSchema,
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
      const data = await engine.queryNotes({
        qs: "",
        originalQS: "",
        vault,
      });
      const expectedNote = (
        await engine.findNotes({
          fname: "root",
          vault,
        })
      )[0];
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
  // Querying for non-existing note should return empty []
  MISSING_QUERY: new TestPresetEntryV4(
    async ({ vaults, engine }) => {
      const data = await engine.queryNotes({
        qs: "bar",
        originalQS: "bar",
        vault: vaults[0],
      });

      return [
        {
          actual: data,
          expected: [],
        },
      ];
    },
    {
      preSetupHook: setupEmpty,
    }
  ),
  STAR_QUERY: new TestPresetEntryV4(
    async ({ vaults, engine }) => {
      const vault = vaults[0];
      const data = await engine.queryNotes({
        qs: "*",
        originalQS: "*",
        vault,
      });
      return [
        {
          actual: data?.length,
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
      const fname = NOTE_PRESETS_V4.NOTE_SIMPLE.fname;
      const data = await engine.queryNotes({
        qs: fname,
        originalQS: fname,
        vault,
      });
      const expectedNote = (
        await engine.findNotes({
          fname,
          vault,
        })
      )[0];
      return [
        {
          actual: data ? data[0] : undefined,
          expected: expectedNote,
        },
        {
          actual: data ? data[0].schema : undefined,
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
      const fname = NOTE_PRESETS_V4.NOTE_SIMPLE_CHILD.fname;
      const data = await engine.queryNotes({
        qs: fname,
        originalQS: fname,
        vault,
      });
      const expectedNote = (
        await engine.findNotes({
          fname,
          vault,
        })
      )[0];
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
            schemaId: DNodeUtils.basename(
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
  NOTE_META_QUERY: new TestPresetEntryV4(
    async ({ vaults, engine }) => {
      const vault = vaults[0];
      const fname = NOTE_PRESETS_V4.NOTE_SIMPLE.fname;
      const data = await engine.queryNotesMeta({
        qs: fname,
        originalQS: fname,
        vault,
      });
      const expectedNote = (
        await engine.findNotesMeta({
          fname,
          vault,
        })
      )[0];
      return [
        {
          actual: data ? data[0] : undefined,
          expected: expectedNote,
        },
        {
          actual: data ? data[0].schema : undefined,
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
};
export const ENGINE_QUERY_PRESETS = {
  NOTES,
  SCHEMAS,
};
