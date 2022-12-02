import {
  DEngineClient,
  DVault,
  ERROR_STATUS,
  INoteStore,
  NotePropsMeta,
} from "@dendronhq/common-all";
import { tmpDir, vault2Path } from "@dendronhq/common-server";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import { runEngineTestV5 } from "./engine";
import { ENGINE_HOOKS } from "./presets";
import os from "os";

/**
 * This function runs all tests that are common to NoteStore. They can be reused
 * by tests that are using different configurations of NoteStore (for example,
 * SqliteMetadataStore vs NoteMetadataStore)
 * */
export function runAllNoteStoreTests(
  noteStoreFactory: (
    wsRoot: string,
    vaults: DVault[],
    engine: DEngineClient
  ) => Promise<INoteStore<string>>
) {
  findAndFindMetadataTest(noteStoreFactory);
  queryMetadataTest(noteStoreFactory);
  retrieveSameNoteTest(noteStoreFactory);
  stubNoteTest(noteStoreFactory);
  getDeletedNoteTest(noteStoreFactory);
  updateNoteTest(noteStoreFactory);
  writeSameFnameTest(noteStoreFactory);
  writeMismatchKeyTest(noteStoreFactory);
  retrieveMetadataOnlyTest(noteStoreFactory);
  bulkWriteMetadataTest(noteStoreFactory);
  deleteRootNoteTest(noteStoreFactory);
  getNoteWithAbsolutePathVault(noteStoreFactory);
}

export function runAllNoteStoreTestsForSqlite(
  noteStoreFactory: (
    wsRoot: string,
    vaults: DVault[],
    engine: DEngineClient
  ) => Promise<INoteStore<string>>
) {
  runAllNoteStoreTests(noteStoreFactory);
  getNoteWithSchemaTest(noteStoreFactory);
}

function findAndFindMetadataTest(
  noteStoreFactory: (
    wsRoot: string,
    vaults: DVault[],
    engine: DEngineClient
  ) => Promise<INoteStore<string>>
) {
  test("WHEN workspace contains notes, THEN find and findMetadata should return correct notes", async () => {
    await runEngineTestV5(
      async ({ vaults, wsRoot, engine }) => {
        const noteStore = await noteStoreFactory(wsRoot, vaults, engine);

        const engineNotes = await engine.findNotesMeta({ excludeStub: false });
        await Promise.all(
          engineNotes.map(async (noteMeta) => {
            return noteStore.writeMetadata({ key: noteMeta.id, noteMeta });
          })
        );

        // Test NoteStore.find
        let findResp = await noteStore.find({ fname: "foo" });
        expect(findResp.data!.length).toEqual(1);
        let note = findResp.data![0];
        expect(note.fname).toEqual("foo");
        expect(note.body).toEqual("foo body");

        // Test NoteStore.find empty
        findResp = await noteStore.find({});
        expect(findResp.data!.length).toEqual(0);

        // Test NoteStore.findMetaData fname property
        let metadataResp = await noteStore.findMetaData({ fname: "foo" });
        expect(metadataResp.data!.length).toEqual(1);
        let noteMetadata = metadataResp.data![0];
        expect(noteMetadata.fname).toEqual("foo");

        // Test NoteStore.find multiple matches
        findResp = await noteStore.find({ fname: "root" });
        expect(findResp.data!.length).toEqual(3);
        findResp = await noteStore.find({ fname: "root", vault: vaults[0] });
        expect(findResp.data!.length).toEqual(1);
        note = findResp.data![0];
        expect(note.fname).toEqual("root");
        expect(note.vault.fsPath).toEqual(vaults[0].fsPath);

        // Test NoteStore.findMetaData fname + vault
        metadataResp = await noteStore.findMetaData({ fname: "root" });
        expect(metadataResp.data!.length).toEqual(3);
        metadataResp = await noteStore.findMetaData({
          fname: "root",
          vault: vaults[1],
        });
        expect(metadataResp.data!.length).toEqual(1);
        noteMetadata = metadataResp.data![0];
        expect(noteMetadata.fname).toEqual("root");
        expect(noteMetadata.vault.fsPath).toEqual(vaults[1].fsPath);

        // Test NoteStore.findMetaData vault property
        metadataResp = await noteStore.findMetaData({
          vault: vaults[0],
        });
        expect(metadataResp.data!.length).toEqual(4);

        // Write stub note to note store
        const newNote = await NoteTestUtilsV4.createNote({
          fname: "foobar",
          body: "",
          vault: vaults[0],
          wsRoot,
          stub: true,
        });

        note = (await noteStore.get(newNote.id)).data!;
        expect(note).toBeFalsy();
        await noteStore.write({ key: newNote.id, note: newNote });

        // Test NoteStore.findMetadata excludeStub = true
        metadataResp = await noteStore.findMetaData({
          excludeStub: true,
        });
        expect(metadataResp.data!.length).toEqual(6);

        // Test NoteStore.findMetadata excludeStub = false
        metadataResp = await noteStore.findMetaData({
          excludeStub: false,
        });
        expect(metadataResp.data!.length).toEqual(7);
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });
}

function queryMetadataTest(
  noteStoreFactory: (
    wsRoot: string,
    vaults: DVault[],
    engine: DEngineClient
  ) => Promise<INoteStore<string>>
) {
  test("WHEN workspace contains notes, THEN queryMetadata should return correct notes", async () => {
    await runEngineTestV5(
      async ({ wsRoot, vaults, engine }) => {
        const noteStore = await noteStoreFactory(wsRoot, vaults, engine);

        const engineNotes = await engine.findNotesMeta({ excludeStub: false });
        await Promise.all(
          engineNotes.map(async (noteMeta) => {
            return noteStore.writeMetadata({ key: noteMeta.id, noteMeta });
          })
        );

        // Test NoteStore.query
        let queryResp = await noteStore.queryMetadata({
          qs: "foo.ch1",
          originalQS: "foo.ch1",
        });
        expect(queryResp.isOk()).toBeTruthy();
        queryResp.map((results) => {
          expect(results.length).toEqual(1);
          expect(results[0].fname).toEqual("foo.ch1");
        });

        // Test NoteStore.find empty query returns root notes
        queryResp = await noteStore.queryMetadata({ qs: "", originalQS: "" });
        expect(queryResp.isOk()).toBeTruthy();
        queryResp.map((results) => {
          expect(results.length).toEqual(3);
          expect(results[0].fname).toEqual("root");
          expect(results[1].fname).toEqual("root");
          expect(results[2].fname).toEqual("root");
        });

        // Test NoteStore.find multiple matches
        queryResp = await noteStore.queryMetadata({
          qs: "fo",
          originalQS: "fo",
        });
        expect(queryResp.isOk()).toBeTruthy();
        queryResp.map((results) => {
          expect(results.length).toEqual(2);

          const fnames = results.map((result) => result.fname);
          expect(fnames.includes("foo")).toBeTruthy();
          expect(fnames.includes("foo.ch1")).toBeTruthy();
        });
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });
}

function retrieveSameNoteTest(
  noteStoreFactory: (
    wsRoot: string,
    vaults: DVault[],
    engine: DEngineClient
  ) => Promise<INoteStore<string>>
) {
  test("WHEN writing a note, THEN get, getMetadata, and queryMetadata should retrieve same note", async () => {
    await runEngineTestV5(
      async ({ vaults, wsRoot, engine }) => {
        const vault = vaults[0];
        const noteStore = await noteStoreFactory(wsRoot, vaults, engine);

        const newNote = await NoteTestUtilsV4.createNote({
          fname: "foobar",
          body: "note body",
          vault,
          wsRoot,
        });

        let note = await noteStore.get(newNote.id);
        expect(note.data).toBeFalsy();
        let queryResp = await noteStore.queryMetadata({
          qs: "foobar",
          originalQS: "foobar",
        });
        expect(queryResp.isOk()).toBeTruthy();
        queryResp.map((results) => {
          expect(results.length).toEqual(0);
        });
        await noteStore.write({ key: newNote.id, note: newNote });

        // Make sure note is written to filesystem
        const vpath = vault2Path({ vault, wsRoot });
        expect(_.includes(fs.readdirSync(vpath), "foobar.md")).toBeTruthy();

        // Test NoteStore.get
        note = await noteStore.get(newNote.id);
        expect(note.data!.fname).toEqual(newNote.fname);
        expect(note.data!.body.trim()).toEqual(newNote.body.trim());
        expect(note.data!.contentHash).toBeTruthy();
        expect(newNote.data!.contentHash).toBeFalsy();

        // Test NoteStore.getMetadata
        const noteMetadata = await noteStore.getMetadata(newNote.id);
        expect(noteMetadata.data!.fname).toEqual(newNote.fname);

        // Test NoteStore.queryMetadata
        queryResp = await noteStore.queryMetadata({
          qs: "foobar",
          originalQS: "foobar",
        });
        expect(queryResp.isOk()).toBeTruthy();
        queryResp.map((results) => {
          expect(results.length).toEqual(1);
          expect(results[0].fname).toEqual("foobar");
        });
      },
      {
        expect,
      }
    );
  });
}

function stubNoteTest(
  noteStoreFactory: (
    wsRoot: string,
    vaults: DVault[],
    engine: DEngineClient
  ) => Promise<INoteStore<string>>
) {
  test("WHEN writing a stub note, THEN get and getMetadata should retrieve same note", async () => {
    await runEngineTestV5(
      async ({ vaults, wsRoot, engine }) => {
        const vault = vaults[0];

        const noteStore = await noteStoreFactory(wsRoot, vaults, engine);
        const newNote = await NoteTestUtilsV4.createNote({
          fname: "foobar",
          body: "",
          vault,
          wsRoot,
          stub: true,
        });

        let note = await noteStore.get(newNote.id);
        expect(note.data).toBeFalsy();
        await noteStore.write({ key: newNote.id, note: newNote });

        // Make sure note is not written to filesystem
        const vpath = vault2Path({ vault, wsRoot });
        expect(_.includes(fs.readdirSync(vpath), "foobar.md")).toBeFalsy();

        // Test NoteStore.get
        note = await noteStore.get(newNote.id);
        expect(note.data!.fname).toEqual(newNote.fname);
        expect(note.data!.body.trim()).toEqual(newNote.body.trim());
        expect(note.data!.contentHash).toBeTruthy();

        // Test NoteStore.getMetadata
        const noteMetadata = await noteStore.getMetadata(newNote.id);
        expect(noteMetadata.data!.fname).toEqual(newNote.fname);

        // Test NoteStore.findMetadata
        let findResp = await noteStore.findMetaData({ fname: "foobar" });
        expect(findResp.data![0].fname).toEqual(newNote.fname);

        // Test NoteStore.findMetadata excludeStub = true
        findResp = await noteStore.findMetaData({
          fname: "foobar",
          excludeStub: true,
        });
        expect(findResp.data!.length).toEqual(0);

        // Test NoteStore.findMetadata excludeStub = false
        findResp = await noteStore.findMetaData({
          excludeStub: false,
        });

        expect(
          findResp.data!.map((meta) => meta.fname).includes(newNote.fname)
        ).toBeTruthy();
      },
      {
        expect,
      }
    );
  });
}

function getDeletedNoteTest(
  noteStoreFactory: (
    wsRoot: string,
    vaults: DVault[],
    engine: DEngineClient
  ) => Promise<INoteStore<string>>
) {
  test("WHEN writing and deleting a note, THEN get should return CONTENT_NOT_FOUND", async () => {
    await runEngineTestV5(
      async ({ vaults, wsRoot, engine }) => {
        const vault = vaults[0];

        const noteStore = await noteStoreFactory(wsRoot, vaults, engine);
        const newNote = await NoteTestUtilsV4.createNote({
          fname: "foobar",
          body: "note body",
          vault,
          wsRoot,
        });

        await noteStore.write({ key: newNote.id, note: newNote });

        // Test NoteStore.get
        const note = await noteStore.get(newNote.id);
        expect(note.data!.fname).toEqual(newNote.fname);

        // Test NoteStore.queryMetadata
        let queryResp = await noteStore.queryMetadata({
          qs: "foobar",
          originalQS: "foobar",
        });
        expect(queryResp.isOk()).toBeTruthy();
        queryResp.map((results) => {
          expect(results.length).toEqual(1);
          expect(results[0].fname).toEqual("foobar");
        });

        // Test NoteStore.delete
        const deleteResp = await noteStore.delete(newNote.id);
        expect(deleteResp.data).toBeTruthy();

        const note2 = await noteStore.get(newNote.id);
        expect(note2.error?.status).toEqual(ERROR_STATUS.CONTENT_NOT_FOUND);

        queryResp = await noteStore.queryMetadata({
          qs: "foobar",
          originalQS: "foobar",
        });
        expect(queryResp.isOk()).toBeTruthy();
        queryResp.map((results) => {
          expect(results.length).toEqual(0);
        });
      },
      {
        expect,
      }
    );
  });
}

function updateNoteTest(
  noteStoreFactory: (
    wsRoot: string,
    vaults: DVault[],
    engine: DEngineClient
  ) => Promise<INoteStore<string>>
) {
  test("WHEN writing a note, THEN subsequent writes should update note", async () => {
    await runEngineTestV5(
      async ({ vaults, wsRoot, engine }) => {
        const vault = vaults[0];

        const noteStore = await noteStoreFactory(wsRoot, vaults, engine);
        const newNote = await NoteTestUtilsV4.createNote({
          fname: "foobar",
          body: "note body",
          vault,
          wsRoot,
        });

        let writeResp = await noteStore.write({
          key: newNote.id,
          note: newNote,
        });
        expect(writeResp.data).toBeTruthy();

        const note = await noteStore.get(newNote.id);
        expect(note.data!.fname).toEqual(newNote.fname);
        expect(note.data!.body.trim()).toEqual(newNote.body.trim());

        // Write same note
        writeResp = await noteStore.write({ key: newNote.id, note: newNote });
        expect(writeResp.data).toBeTruthy();
        const note2 = await noteStore.get(newNote.id);
        expect(note2.data!.fname).toEqual(newNote.fname);
        expect(note2.data!.body.trim()).toEqual(newNote.body.trim());
        expect(note2.data!.contentHash === note.data!.contentHash).toBeTruthy();

        // Update note body and write
        newNote.body = "new body";
        writeResp = await noteStore.write({ key: newNote.id, note: newNote });
        expect(writeResp.data).toBeTruthy();

        const note3 = await noteStore.get(newNote.id);
        expect(note3.data!.fname).toEqual(newNote.fname);
        expect(note3.data!.body.trim()).toEqual(newNote.body.trim());
        expect(note3.data!.contentHash !== note.data!.contentHash).toBeTruthy();
      },
      {
        expect,
      }
    );
  });
}

function writeSameFnameTest(
  noteStoreFactory: (
    wsRoot: string,
    vaults: DVault[],
    engine: DEngineClient
  ) => Promise<INoteStore<string>>
) {
  test("WHEN writing a note with the same fname, THEN content hash should change", async () => {
    await runEngineTestV5(
      async ({ vaults, wsRoot, engine }) => {
        const vault = vaults[0];

        const noteStore = await noteStoreFactory(wsRoot, vaults, engine);
        const newNote = await NoteTestUtilsV4.createNote({
          fname: "foobar",
          body: "note body",
          vault,
          wsRoot,
        });
        const diffNote = await NoteTestUtilsV4.createNote({
          fname: "foobar",
          genRandomId: true,
          body: "note body baz",
          vault: vaults[1],
          wsRoot,
        });

        let writeResp = await noteStore.write({
          key: newNote.id,
          note: newNote,
        });
        expect(writeResp.data).toBeTruthy();

        // Write note with same fname
        writeResp = await noteStore.write({ key: diffNote.id, note: diffNote });
        expect(writeResp.data).toBeTruthy();

        const note = await noteStore.get(newNote.id);
        const note2 = await noteStore.get(diffNote.id);

        expect(note.data!.fname).toEqual(note2.data!.fname);
        expect(note.data!.id).toEqual(newNote.id);
        expect(note2.data!.id).toEqual(diffNote.id);
        expect(note.data!.contentHash !== note2.data!.contentHash).toBeTruthy();
      },
      {
        expect,
      }
    );
  });
}
function writeMismatchKeyTest(
  noteStoreFactory: (
    wsRoot: string,
    vaults: DVault[],
    engine: DEngineClient
  ) => Promise<INoteStore<string>>
) {
  test("WHEN writing a note with a mismatched key, THEN error should be returned", async () => {
    await runEngineTestV5(
      async ({ vaults, wsRoot, engine }) => {
        const vault = vaults[0];

        const noteStore = await noteStoreFactory(wsRoot, vaults, engine);
        const newNote = await NoteTestUtilsV4.createNote({
          fname: "foobar",
          body: "note body",
          vault,
          wsRoot,
        });

        const writeResp = await noteStore.write({ key: "bar", note: newNote });
        expect(writeResp.data).toBeFalsy();
        expect(writeResp.error?.status).toEqual(ERROR_STATUS.WRITE_FAILED);
      },
      {
        expect,
      }
    );
  });
}

function retrieveMetadataOnlyTest(
  noteStoreFactory: (
    wsRoot: string,
    vaults: DVault[],
    engine: DEngineClient
  ) => Promise<INoteStore<string>>
) {
  test("WHEN writing and getting metadata, THEN only metadata should be retrieved", async () => {
    await runEngineTestV5(
      async ({ vaults, wsRoot, engine }) => {
        const vault = vaults[0];

        const noteStore = await noteStoreFactory(wsRoot, vaults, engine);
        const newNote = await NoteTestUtilsV4.createNote({
          fname: "foobar",
          body: "note body",
          vault,
          wsRoot,
          noWrite: true,
        });

        let noteMeta: NotePropsMeta = _.omit(newNote, ["body"]);
        let writeResp = await noteStore.writeMetadata({
          key: newNote.id,
          noteMeta,
        });
        expect(writeResp.data).toBeTruthy();

        // Only metadata should be persisted, not note body itself
        const note = await noteStore.get(newNote.id);
        expect(note.error?.status).toEqual(ERROR_STATUS.CONTENT_NOT_FOUND);

        const metadata = await noteStore.getMetadata(newNote.id);
        expect(metadata.data!.fname).toEqual(newNote.fname);

        // Write same note
        noteMeta = _.omit(newNote, ["body"]);
        writeResp = await noteStore.writeMetadata({
          key: newNote.id,
          noteMeta,
        });
        expect(writeResp.data).toBeTruthy();
        const note2 = await noteStore.getMetadata(newNote.id);
        expect(note2.data!.fname).toEqual(newNote.fname);

        // Update note metadata and write
        newNote.color = "new color";
        noteMeta = _.omit(newNote, ["body"]);
        writeResp = await noteStore.writeMetadata({
          key: newNote.id,
          noteMeta,
        });
        expect(writeResp.data).toBeTruthy();

        const note3 = await noteStore.getMetadata(newNote.id);
        expect(note3.data!.fname).toEqual(newNote.fname);
        expect(note3.data!.color !== note2.data!.color).toBeTruthy();
        expect(note3.data!.color === "new color").toBeTruthy();
      },
      {
        expect,
      }
    );
  });
}

function bulkWriteMetadataTest(
  noteStoreFactory: (
    wsRoot: string,
    vaults: DVault[],
    engine: DEngineClient
  ) => Promise<INoteStore<string>>
) {
  test("WHEN bulk writing metadata, THEN all metadata should be retrievable", async () => {
    await runEngineTestV5(
      async ({ vaults, wsRoot, engine }) => {
        const vault = vaults[0];

        const noteStore = await noteStoreFactory(wsRoot, vaults, engine);
        const newNote = await NoteTestUtilsV4.createNote({
          fname: "foobar123",
          body: "note body",
          vault,
          wsRoot,
          noWrite: true,
        });
        const anotherNote = await NoteTestUtilsV4.createNote({
          fname: "baz",
          body: "baz body",
          vault,
          wsRoot,
          noWrite: true,
        });

        const newNoteMeta: NotePropsMeta = _.omit(newNote, ["body"]);
        const anotherNoteMeta: NotePropsMeta = _.omit(anotherNote, ["body"]);
        const writeResp = await noteStore.bulkWriteMetadata([
          {
            key: newNoteMeta.id,
            noteMeta: newNoteMeta,
          },
          {
            key: anotherNoteMeta.id,
            noteMeta: anotherNoteMeta,
          },
        ]);
        expect(writeResp.length).toEqual(2);

        // Only metadata should be persisted, not note body itself
        const note = await noteStore.get(newNote.id);
        expect(note.error?.status).toEqual(ERROR_STATUS.CONTENT_NOT_FOUND);

        // Read back metadata
        const metadata = await noteStore.getMetadata(newNote.id);
        expect(metadata.data!.fname).toEqual(newNote.fname);

        const anotherMetadata = await noteStore.getMetadata(anotherNote.id);
        expect(anotherMetadata.data!.fname).toEqual(anotherNote.fname);
      },
      {
        expect,
      }
    );
  });
}

function deleteRootNoteTest(
  noteStoreFactory: (
    wsRoot: string,
    vaults: DVault[],
    engine: DEngineClient
  ) => Promise<INoteStore<string>>
) {
  test("WHEN deleting a root note, THEN error should return and be CANT_DELETE_ROOT", async () => {
    await runEngineTestV5(
      async ({ wsRoot, vaults, engine }) => {
        const noteStore = await noteStoreFactory(wsRoot, vaults, engine);
        const engineNotes = await engine.findNotesMeta({ excludeStub: false });
        await Promise.all(
          engineNotes.map(async (noteMeta) => {
            return noteStore.writeMetadata({ key: noteMeta.id, noteMeta });
          })
        );

        // Test NoteStore.get
        const resp = await noteStore.find({ fname: "root" });

        // Test NoteStore.delete
        const deleteResp = await noteStore.delete(resp.data![0].id);
        expect(deleteResp.data).toBeUndefined();
        expect(deleteResp.error?.status).toEqual(ERROR_STATUS.CANT_DELETE_ROOT);
      },
      {
        expect,
      }
    );
  });
}

function getNoteWithAbsolutePathVault(
  noteStoreFactory: (
    wsRoot: string,
    vaults: DVault[],
    engine: DEngineClient
  ) => Promise<INoteStore<string>>
) {
  const wsRoot = tmpDir().name;
  // giving absolute fsPath for vault
  // to simulate the case where we try to .get() a note
  // when there is a local override vault
  // coming from home directory, which usually
  // would be specified with absolute path
  const vaultsWithAbsoluteFsPath: DVault[] = [
    {
      fsPath: `${wsRoot}`,
      selfContained: true,
      name: "vault",
    },
  ];

  // TODO: Sqlite - this is failing on Windows in CI, need to fix.
  const runTestCaseButSkipForWindows =
    os.platform() === "win32" ? test.skip : test;

  runTestCaseButSkipForWindows(
    "WHEN get note, then correctly retrieve note by key",
    async () => {
      await runEngineTestV5(
        async ({ wsRoot, engine }) => {
          const noteStore = await noteStoreFactory(
            wsRoot,
            vaultsWithAbsoluteFsPath,
            engine
          );
          const engineNotes = await engine.findNotesMeta({
            excludeStub: false,
          });
          const rootNote = engineNotes[0];
          engineNotes.forEach(async (noteMeta) => {
            await noteStore.writeMetadata({ key: noteMeta.id, noteMeta });
          });

          const resp = await noteStore.get(rootNote.id);
          expect(resp.error).toBeFalsy();
          expect(resp.data?.id).toEqual(rootNote.id);
          expect(resp.data?.fname).toEqual(rootNote.fname);
        },
        {
          expect,
          wsRoot,
          vaults: vaultsWithAbsoluteFsPath,
          modConfigCb: (config) => {
            config.dev = {
              enableEngineV3: true,
            };
            return config;
          },
        }
      );
    }
  );
}

function getNoteWithSchemaTest(
  noteStoreFactory: (
    wsRoot: string,
    vaults: DVault[],
    engine: DEngineClient
  ) => Promise<INoteStore<string>>
) {
  test("WHEN getting a note with schema, THEN the resulting NoteProps has correct `schema` property populated", async () => {
    await runEngineTestV5(
      async ({ wsRoot, vaults, engine }) => {
        const noteStore = await noteStoreFactory(wsRoot, vaults, engine);
        const ch1Metadata = (await noteStore.getMetadata("bar.ch1")).data;
        const ch2Metadata = (await noteStore.getMetadata("bar.ch2")).data;
        expect(ch1Metadata?.schema).toEqual({
          moduleId: "bar",
          schemaId: "ch1",
        });
        expect(ch2Metadata?.schema).toEqual({
          moduleId: "bar",
          schemaId: "ch2",
        });
      },
      {
        expect,
        preSetupHook: async (opts) => {
          const { wsRoot, vaults } = opts;
          await ENGINE_HOOKS.setupSchemaPreseet(opts);
          await NoteTestUtilsV4.createNote({
            fname: "bar.ch1",
            body: "",
            vault: vaults[0],
            wsRoot,
          });
          await NoteTestUtilsV4.createNote({
            fname: "bar.ch2",
            body: "",
            vault: vaults[0],
            wsRoot,
          });
        },
      }
    );
  });
}
