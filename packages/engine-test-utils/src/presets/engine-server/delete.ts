import {
  NoteChangeEntry,
  NotesCacheEntryMap,
  NoteUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import {
  TestPresetEntryV4,
  SCHEMA_PRESETS_V4,
  FileTestUtils,
  EngineTestUtilsV4,
  NoteTestUtilsV4,
} from "@dendronhq/common-test-utils";
import {
  createCacheEntry,
  readNotesFromCache,
  writeNotesToCache,
} from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import { ENGINE_HOOKS, setupBasic } from "./utils";

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
  GRANDCHILD_WITH_ALL_STUB_PARENTS: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const vault = vaults[0];
      const cacheVault = readNotesFromCache(vault2Path({ wsRoot, vault }));
      const resp = await engine.deleteNote(
        NoteUtils.getNoteByFnameFromEngine({
          fname: "foo.ch1",
          vault,
          engine,
        })?.id as string
      );
      const changed = resp.data;
      await engine.init();
      return [
        {
          actual: await EngineTestUtilsV4.checkVault({
            wsRoot,
            vault,
            nomatch: ["foo"],
          }),
          expected: true,
        },
        {
          actual: _.find(
            changed,
            (ent) => ent.status === "delete" && ent.note.fname === "foo.ch1"
          ),
          expected: true,
        },
        {
          actual: _.find(
            changed,
            (ent) => ent.status === "delete" && ent.note.fname === "foo"
          ),
          expected: true,
        },
        {
          actual: _.find(
            changed,
            (ent) => ent.status === "update" && ent.note.fname === "root"
          ),
          expected: true,
        },
        {
          actual: _.size(cacheVault.notes),
          expected: 2,
        },
        {
          actual: _.size(
            readNotesFromCache(vault2Path({ wsRoot, vault })).notes
          ),
          expected: 1,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NoteTestUtilsV4.createNote({
          fname: "foo.ch1",
          vault: vaults[0],
          wsRoot,
          body: "",
        });
      },
    }
  ),
  NOTE_NO_CHILDREN: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const vault = vaults[0];
      const notes = engine.notes;
      const cacheVault = readNotesFromCache(vault2Path({ wsRoot, vault }));
      const resp = await engine.deleteNote(
        NoteUtils.getNoteByFnameFromEngine({
          fname: "foo.ch1",
          vault,
          engine,
        })?.id as string
      );
      const changed = resp.data;
      const vpath = vault2Path({ vault, wsRoot });
      await engine.init();
      return [
        { actual: changed[0].note.id, expected: "foo" },
        { actual: _.size(notes), expected: 4 },
        { actual: notes["foo"].children, expected: [] },
        {
          actual: _.includes(fs.readdirSync(vpath), "foo.ch1.md"),
          expected: false,
        },
        {
          actual: _.size(cacheVault.notes),
          expected: 3,
        },
        {
          actual: _.size(
            readNotesFromCache(vault2Path({ wsRoot, vault })).notes
          ),
          expected: 2,
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
      const noteToDelete = NoteUtils.getNoteByFnameFromEngine({
        fname: "foo",
        vault,
        engine,
      });
      const prevNote = { ...noteToDelete };
      const resp = await engine.deleteNote(noteToDelete?.id as string);
      const changed = resp.data;
      const notes = engine.notes;
      const vpath = vault2Path({ vault, wsRoot });
      return [
        {
          actual: changed,
          expected: [{ note: notes["foo"], prevNote, status: "update" }],
          msg: "note updated",
        },
        {
          actual: _.size(notes),
          expected: 5,
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
      const cacheVault = readNotesFromCache(vault2Path({ wsRoot, vault }));
      const noteToDelete = NoteUtils.getNoteByFnameFromEngine({
        fname: "foo",
        vault,
        engine,
      });
      const resp = await engine.deleteNote(noteToDelete?.id as string);
      const changed = resp.data as NoteChangeEntry[];
      const notes = engine.notes;
      const vpath = vault2Path({ vault, wsRoot });
      await engine.init();
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
        { actual: _.size(notes), expected: 3 },
        { actual: notes["foo"], expected: undefined },
        {
          actual: _.includes(fs.readdirSync(vpath), "foo.md"),
          expected: false,
        },
        {
          actual: _.size(cacheVault.notes),
          expected: 2,
        },
        {
          actual: _.size(
            readNotesFromCache(vault2Path({ wsRoot, vault })).notes
          ),
          expected: 1,
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
  STALE_CACHE_ENTRY: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const vault = vaults[0];
      const cache: NotesCacheEntryMap = {};
      const cacheVault = readNotesFromCache(vault2Path({ wsRoot, vault }));
      _.merge(cache, cacheVault.notes);

      // Create random note and write to cache
      const staleNote = await NoteTestUtilsV4.createNote({
        fname: "my-new-note",
        wsRoot,
        vault: vaults[0],
        noWrite: true,
      });
      const cacheEntry = createCacheEntry({
        noteProps: staleNote,
        hash: "123123",
      });
      cache["my-new-note"] = cacheEntry;
      cacheVault.notes = cache;
      writeNotesToCache(vault2Path({ wsRoot, vault }), cacheVault);

      // Should remove random note from cache
      await engine.init();
      return [
        {
          actual: _.size(cacheVault.notes),
          expected: 5,
        },
        {
          actual: cacheVault.notes["my-new-note"].data.fname,
          expected: "my-new-note",
        },
        {
          actual: _.size(
            readNotesFromCache(vault2Path({ wsRoot, vault })).notes
          ),
          expected: 4,
        },
      ];
    },
    {
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
      },
    }
  ),
  MULTIPLE_DELETES: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const vault = vaults[0];
      const notes = engine.notes;
      const cacheVault = readNotesFromCache(vault2Path({ wsRoot, vault }));
      const resp = await engine.deleteNote(
        NoteUtils.getNoteByFnameFromEngine({
          fname: "foo.ch1",
          vault,
          engine,
        })?.id as string
      );
      const changed = resp.data;
      const resp2 = await engine.deleteNote(
        NoteUtils.getNoteByFnameFromEngine({
          fname: "foo",
          vault,
          engine,
        })?.id as string
      );
      const changed2 = resp2.data;
      await engine.init();
      return [
        { actual: _.size(notes), expected: 3 },
        {
          actual: _.find(
            changed,
            (ent) => ent.status === "delete" && ent.note.fname === "foo.ch1"
          ),
          expected: true,
        },
        {
          actual: _.find(
            changed2,
            (ent) => ent.status === "delete" && ent.note.fname === "foo"
          ),
          expected: true,
        },
        {
          actual: _.size(cacheVault.notes),
          expected: 3,
        },
        {
          actual: _.size(
            readNotesFromCache(vault2Path({ wsRoot, vault })).notes
          ),
          expected: 1,
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
};
export const ENGINE_DELETE_PRESETS = {
  NOTES,
  SCHEMAS,
};
