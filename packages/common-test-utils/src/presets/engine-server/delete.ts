import { NoteChangeEntry, NoteUtilsV2 } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import fs, { outputFile } from "fs-extra";
import _ from "lodash";
import { FileTestUtils } from "../..";
import { NoteTestUtilsV4 } from "../../noteUtils";
import { TestPresetEntryV4 } from "../../utilsv2";
import { SCHEMA_PRESETS_V4 } from "../schemas";
import { setupBasic } from "./utils";

const SCHEMAS = {
  BASIC: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const vault = vaults[0];
      const schemaId = SCHEMA_PRESETS_V4.SCHEMA_SIMPLE.fname;
      await engine.deleteSchema(schemaId);
      return [
        { actual: _.size(engine.schemas), expected: 1 },
        { actual: engine.schemas[schemaId], expected: undefined },
        {
          actual: await FileTestUtils.assertInVault({
            vault,
            wsRoot,
            nomatch: [`${schemaId}.schema.yml`],
          }),
          expected: true,
        },
      ];
    },
    {
      preSetupHook: setupBasic,
    }
  ),
};
const NOTES = {
  NOTE_NO_CHILDREN: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const vault = vaults[0];
      const notes = engine.notes;
      const resp = await engine.deleteNote(
        NoteUtilsV2.getNoteByFnameV4({ fname: "foo.ch1", vault, notes })
          ?.id as string
      );
      const changed = resp.data;
      const vpath = vault2Path({ vault, wsRoot });
      return [
        { actual: changed[0].note.id, expected: "foo" },
        { actual: _.size(notes), expected: 3 },
        { actual: notes["foo"].children, expected: [] },
        {
          actual: _.includes(fs.readdirSync(vpath), "foo.ch1.md"),
          expected: false,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NoteTestUtilsV4.createNote({
          fname: "foo",
          vault: vaults[0],
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "foo.ch1",
          vault: vaults[0],
          wsRoot,
          body: "",
        });
      },
    }
  ),
  DOMAIN_CHILDREN: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const vault = vaults[0];
      const noteToDelete = NoteUtilsV2.getNoteByFnameV4({
        fname: "foo",
        vault,
        notes: engine.notes,
      });
      const resp = await engine.deleteNote(noteToDelete?.id as string);
      const changed = resp.data as NoteChangeEntry[];
      const notes = engine.notes;
      const vpath = vault2Path({ vault, wsRoot });
      return [
        {
          actual: changed,
          expected: [{ note: notes["foo"], status: "update" }],
          msg: "note updated",
        },
        {
          actual: _.size(notes),
          expected: 4,
          msg: "same number of notes",
        },
        {
          actual: notes["foo"].stub,
          expected: true,
          msg: "foo should be a stub",
        },
        {
          actual: _.includes(fs.readdirSync(vpath), "foo.md"),
          expected: false,
          msg: "note should be deleted",
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NoteTestUtilsV4.createNote({
          fname: "foo",
          vault: vaults[0],
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "foo.ch1",
          vault: vaults[0],
          wsRoot,
          body: "",
        });
      },
    }
  ),
  DOMAIN_NO_CHILDREN: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const vault = vaults[0];
      const noteToDelete = NoteUtilsV2.getNoteByFnameV4({
        fname: "foo",
        vault,
        notes: engine.notes,
      });
      const resp = await engine.deleteNote(noteToDelete?.id as string);
      const changed = resp.data as NoteChangeEntry[];
      const notes = engine.notes;
      const vpath = vault2Path({ vault, wsRoot });
      return [
        {
          actual: changed[0].note.fname,
          expected: "root",
          msg: "root updated",
        },
        {
          actual: changed[0].note.children,
          expected: [],
          msg: "root does not have children",
        },
        { actual: _.size(notes), expected: 2 },
        { actual: notes["foo"], expected: undefined },
        {
          actual: _.includes(fs.readdirSync(vpath), "foo.md"),
          expected: false,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NoteTestUtilsV4.createNote({
          fname: "foo",
          vault: vaults[0],
          wsRoot,
        });
      },
    }
  ),
};
export const ENGINE_DELETE_PRESETS = {
  NOTES,
  SCHEMAS,
};
