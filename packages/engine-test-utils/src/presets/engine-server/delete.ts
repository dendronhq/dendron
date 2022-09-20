import {
  CONSTANTS,
  extractNoteChangeEntriesByType,
  NoteChangeEntry,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import {
  TestPresetEntryV4,
  SCHEMA_PRESETS_V4,
  FileTestUtils,
  EngineTestUtilsV4,
  NoteTestUtilsV4,
  NOTE_PRESETS_V4,
} from "@dendronhq/common-test-utils";
import {
  createCacheEntry,
  DendronEngineClient,
  NotesFileSystemCache,
} from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { ENGINE_HOOKS, setupBasic } from "./utils";

const SCHEMAS = {
  BASIC: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const vault = vaults[0];
      const schemaId = SCHEMA_PRESETS_V4.SCHEMA_SIMPLE.fname;
      const beforeSchema = (await engine.getSchema(schemaId)).data!;
      await engine.deleteSchema(schemaId);
      const afterSchema = (await engine.getSchema(schemaId)).data!;
      return [
        { actual: _.size(beforeSchema.schemas), expected: 2 },
        { actual: afterSchema, expected: undefined },
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
      const logger = (engine as DendronEngineClient).logger;
      const cachePath = path.join(
        vault2Path({ wsRoot, vault }),
        CONSTANTS.DENDRON_CACHE_FILE
      );
      const notesCache = new NotesFileSystemCache({ cachePath, logger });
      const keySet = notesCache.getCacheEntryKeys();
      const fooChildNote = (
        await engine.findNotesMeta({ fname: "foo.ch1", vault })
      )[0];
      const resp = await engine.deleteNote(fooChildNote.id);
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
          actual: keySet.size,
          expected: 2,
        },
        {
          actual: new NotesFileSystemCache({
            cachePath,
            logger,
          }).getCacheEntryKeys().size,
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
      const logger = (engine as DendronEngineClient).logger;
      const notesInVaultBefore = await engine.findNotesMeta({ vault });
      const cachePath = path.join(
        vault2Path({ wsRoot, vault }),
        CONSTANTS.DENDRON_CACHE_FILE
      );
      const notesCache = new NotesFileSystemCache({ cachePath, logger });
      const keySet = notesCache.getCacheEntryKeys();
      const fooChildNote = (
        await engine.findNotesMeta({ fname: "foo.ch1", vault })
      )[0];
      const resp = await engine.deleteNote(fooChildNote.id);

      // Foo's child should be deleted, leaving behind foo and 3 root notes
      const notesInVaultAfter = await engine.findNotesMeta({ vault });
      const fooNote = (await engine.findNotesMeta({ fname: "foo", vault }))[0];
      const changed = resp.data;
      const vpath = vault2Path({ vault, wsRoot });
      await engine.init();
      return [
        { actual: changed![0].note.id, expected: "foo" },
        { actual: _.size(notesInVaultBefore), expected: 3 },
        { actual: _.size(notesInVaultAfter), expected: 2 },
        { actual: fooNote.children, expected: [] },
        {
          actual: _.includes(fs.readdirSync(vpath), "foo.ch1.md"),
          expected: false,
        },
        {
          actual: keySet.size,
          expected: 3,
        },
        {
          actual: new NotesFileSystemCache({
            cachePath,
            logger,
          }).getCacheEntryKeys().size,
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
  NOTE_WITH_TARGET: new TestPresetEntryV4(
    async ({ vaults, engine }) => {
      const vault = vaults[0];
      const notesInVaultBefore = await engine.findNotesMeta({ vault });
      const betaNoteBefore = await engine.getNoteMeta("beta");
      const betaBackLinksBefore = betaNoteBefore.data!.links.filter(
        (link) => link.type === "backlink"
      );
      await engine.deleteNote("alpha");

      // Alpha be deleted, leaving behind beta and 3 root notes
      const notesInVaultAfter = await engine.findNotesMeta({ vault });
      const betaNoteAfter = await engine.getNoteMeta("beta");
      const betaBackLinksAfter = betaNoteAfter.data!.links.filter(
        (link) => link.type === "backlink"
      );
      return [
        { actual: betaNoteBefore.data?.links.length, expected: 2 },
        { actual: betaBackLinksBefore.length, expected: 1 },
        { actual: _.size(notesInVaultBefore), expected: 3 },
        { actual: _.size(notesInVaultAfter), expected: 2 },
        { actual: betaNoteAfter.data?.links.length, expected: 1 },
        { actual: betaBackLinksAfter.length, expected: 0 },
      ];
    },
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
          wsRoot,
          vault: vaults[0],
        });
        await NOTE_PRESETS_V4.NOTE_WITH_LINK.create({
          wsRoot,
          vault: vaults[0],
        });
      },
    }
  ),
  DOMAIN_CHILDREN: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const vault = vaults[0];
      const notesInVaultBefore = await engine.findNotesMeta({ vault });
      const noteToDelete = (
        await engine.findNotesMeta({ fname: "foo", vault })
      )[0];
      const resp = await engine.deleteNote(noteToDelete?.id as string);

      const createEntries = extractNoteChangeEntriesByType(
        resp.data!,
        "create"
      );

      const deleteEntries = extractNoteChangeEntriesByType(
        resp.data!,
        "delete"
      );

      const updateEntries = extractNoteChangeEntriesByType(
        resp.data!,
        "update"
      );

      const notesInVaultAfter = await engine.findNotesMeta({ vault });
      const fooNote = (await engine.findNotesMeta({ fname: "foo", vault }))[0];
      const fooChild = (
        await engine.findNotesMeta({ fname: "foo.ch1", vault })
      )[0];
      const vpath = vault2Path({ vault, wsRoot });

      return [
        {
          actual: updateEntries.length,
          expected: 2,
          msg: "2 updates should happen.",
        },
        {
          actual: deleteEntries.length,
          expected: 1,
          msg: "1 delete should happen.",
        },
        {
          actual: createEntries.length,
          expected: 1,
          msg: "1 create should happen.",
        },
        {
          actual: _.size(notesInVaultBefore),
          expected: 3,
          msg: "Before as root, foo, and foo.ch1",
        },
        {
          actual: _.size(notesInVaultAfter),
          expected: 3,
          msg: "same number of notes as before",
        },
        {
          actual: fooNote.stub,
          expected: true,
          msg: "foo should be a stub",
        },
        {
          actual: fooChild.parent,
          expected: fooNote.id,
          msg: "foo's child should have updated parent id",
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
      const notesInVaultBefore = await engine.findNotesMeta({ vault });
      const logger = (engine as DendronEngineClient).logger;
      const cachePath = path.join(
        vault2Path({ wsRoot, vault }),
        CONSTANTS.DENDRON_CACHE_FILE
      );
      const notesCache = new NotesFileSystemCache({ cachePath, logger });
      const keySet = notesCache.getCacheEntryKeys();
      const noteToDelete = (
        await engine.findNotesMeta({ fname: "foo", vault })
      )[0];
      const resp = await engine.deleteNote(noteToDelete?.id as string);

      const changed = resp.data as NoteChangeEntry[];
      const notesInVaultAfter = await engine.findNotesMeta({ vault });
      const fooNote = (await engine.findNotesMeta({ fname: "foo", vault }))[0];
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
        {
          actual: _.size(notesInVaultBefore),
          expected: 2,
          msg: "Before has root and foo",
        },
        {
          actual: _.size(notesInVaultAfter),
          expected: 1,
          msg: "After has root",
        },
        { actual: fooNote, expected: undefined },
        {
          actual: _.includes(fs.readdirSync(vpath), "foo.md"),
          expected: false,
        },
        {
          actual: keySet.size,
          expected: 2,
        },
        {
          actual: new NotesFileSystemCache({
            cachePath,
            logger,
          }).getCacheEntryKeys().size,
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
      const logger = (engine as DendronEngineClient).logger;
      const cachePath = path.join(
        vault2Path({ wsRoot, vault }),
        CONSTANTS.DENDRON_CACHE_FILE
      );
      const notesCache = new NotesFileSystemCache({ cachePath, logger });

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
      notesCache.set(staleNote.fname, cacheEntry);
      notesCache.writeToFileSystem();
      const keySet = notesCache.getCacheEntryKeys();

      // Should remove random note from cache
      await engine.init();
      return [
        {
          actual: keySet.size,
          expected: 5,
        },
        {
          actual: keySet.has("my-new-note"),
          expected: true,
        },
        {
          actual: new NotesFileSystemCache({
            cachePath,
            logger,
          }).getCacheEntryKeys().size,
          expected: 4,
        },
        {
          actual: new NotesFileSystemCache({ cachePath, logger })
            .getCacheEntryKeys()
            .has("my-new-note"),
          expected: false,
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
      const notesInVaultBefore = await engine.findNotesMeta({ vault });
      const logger = (engine as DendronEngineClient).logger;
      const cachePath = path.join(
        vault2Path({ wsRoot, vault }),
        CONSTANTS.DENDRON_CACHE_FILE
      );
      const notesCache = new NotesFileSystemCache({ cachePath, logger });
      const keySet = notesCache.getCacheEntryKeys();
      const fooChildNote = (
        await engine.findNotesMeta({ fname: "foo.ch1", vault })
      )[0];
      const resp = await engine.deleteNote(fooChildNote.id);
      const changed = resp.data;

      const fooNote = (await engine.findNotesMeta({ fname: "foo", vault }))[0];
      const resp2 = await engine.deleteNote(fooNote.id);
      const changed2 = resp2.data;
      const notesInVaultAfter = await engine.findNotesMeta({ vault });
      await engine.init();
      return [
        {
          actual: _.size(notesInVaultBefore),
          expected: 3,
          msg: "Before has root, foo, and foo.ch1",
        },
        {
          actual: _.size(notesInVaultAfter),
          expected: 1,
          msg: "After has root",
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
            changed2,
            (ent) => ent.status === "delete" && ent.note.fname === "foo"
          ),
          expected: true,
        },
        {
          actual: keySet.size,
          expected: 3,
        },
        {
          actual: new NotesFileSystemCache({
            cachePath,
            logger,
          }).getCacheEntryKeys().size,
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
