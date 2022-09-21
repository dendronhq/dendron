import {
  ERROR_STATUS,
  NoteMetadataStore,
  NotePropsMeta,
  NoteStore,
  URI,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { NodeJSFileStore } from "@dendronhq/engine-server";
import _ from "lodash";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS } from "../../../presets";
import fs from "fs-extra";

describe("GIVEN NoteStore", () => {
  test("WHEN workspace contains notes, THEN find and findMetadata should return correct notes", async () => {
    await runEngineTestV5(
      async ({ vaults, wsRoot, engine }) => {
        const noteStore = new NoteStore(
          new NodeJSFileStore(),
          new NoteMetadataStore(),
          URI.file(wsRoot)
        );

        const engineNotes = await engine.findNotesMeta({ excludeStub: false });
        engineNotes.forEach(async (noteMeta) => {
          await noteStore.writeMetadata({ key: noteMeta.id, noteMeta });
        });

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

  test("WHEN writing a note, THEN get and getMetadata should retrieve same note", async () => {
    await runEngineTestV5(
      async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const noteStore = new NoteStore(
          new NodeJSFileStore(),
          new NoteMetadataStore(),
          URI.file(wsRoot)
        );

        const newNote = await NoteTestUtilsV4.createNote({
          fname: "foobar",
          body: "note body",
          vault,
          wsRoot,
        });

        let note = await noteStore.get(newNote.id);
        expect(note.data).toBeFalsy();
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
      },
      {
        expect,
      }
    );
  });

  test("WHEN writing a stub note, THEN get and getMetadata should retrieve same note", async () => {
    await runEngineTestV5(
      async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const noteStore = new NoteStore(
          new NodeJSFileStore(),
          new NoteMetadataStore(),
          URI.file(wsRoot)
        );
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
        expect(note.data!.contentHash).toBeFalsy();
        expect(newNote.data!.contentHash).toBeFalsy();

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
        expect(findResp.data![0].fname).toEqual(newNote.fname);
      },
      {
        expect,
      }
    );
  });

  test("WHEN writing and deleting a note, THEN get should return CONTENT_NOT_FOUND", async () => {
    await runEngineTestV5(
      async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const noteStore = new NoteStore(
          new NodeJSFileStore(),
          new NoteMetadataStore(),
          URI.file(wsRoot)
        );
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

        // Test NoteStore.delete
        const deleteResp = await noteStore.delete(newNote.id);
        expect(deleteResp.data).toBeTruthy();

        const note2 = await noteStore.get(newNote.id);
        expect(note2.error?.status).toEqual(ERROR_STATUS.CONTENT_NOT_FOUND);
      },
      {
        expect,
      }
    );
  });

  test("WHEN writing a note, THEN subsequent writes should update note", async () => {
    await runEngineTestV5(
      async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const noteStore = new NoteStore(
          new NodeJSFileStore(),
          new NoteMetadataStore(),
          URI.file(wsRoot)
        );
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

  test("WHEN writing a note with the same fname, THEN content hash should change", async () => {
    await runEngineTestV5(
      async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const noteStore = new NoteStore(
          new NodeJSFileStore(),
          new NoteMetadataStore(),
          URI.file(wsRoot)
        );
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

  test("WHEN writing a note with a mismatched key, THEN error should be returned", async () => {
    await runEngineTestV5(
      async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const noteStore = new NoteStore(
          new NodeJSFileStore(),
          new NoteMetadataStore(),
          URI.file(wsRoot)
        );
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

  test("WHEN writing and getting metadata, THEN only metadata should be retrieved", async () => {
    await runEngineTestV5(
      async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const noteStore = new NoteStore(
          new NodeJSFileStore(),
          new NoteMetadataStore(),
          URI.file(wsRoot)
        );
        const newNote = await NoteTestUtilsV4.createNote({
          fname: "foobar",
          body: "note body",
          vault,
          wsRoot,
          noWrite: true,
        });

        let noteMeta: NotePropsMeta = _.omit(newNote, ["body", "contentHash"]);
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
        noteMeta = _.omit(newNote, ["body", "contentHash"]);
        writeResp = await noteStore.writeMetadata({
          key: newNote.id,
          noteMeta,
        });
        expect(writeResp.data).toBeTruthy();
        const note2 = await noteStore.getMetadata(newNote.id);
        expect(note2.data!.fname).toEqual(newNote.fname);

        // Update note metadata and write
        newNote.color = "new color";
        noteMeta = _.omit(newNote, ["body", "contentHash"]);
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

  test("WHEN bulk writing metadata, THEN all metadata should be retrievable", async () => {
    await runEngineTestV5(
      async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const noteStore = new NoteStore(
          new NodeJSFileStore(),
          new NoteMetadataStore(),
          URI.file(wsRoot)
        );
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

        const newNoteMeta: NotePropsMeta = _.omit(newNote, [
          "body",
          "contentHash",
        ]);
        const anotherNoteMeta: NotePropsMeta = _.omit(anotherNote, [
          "body",
          "contentHash",
        ]);
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

  test("WHEN deleting a root note, THEN error should return and be CANT_DELETE_ROOT", async () => {
    await runEngineTestV5(
      async ({ wsRoot, engine }) => {
        const noteStore = new NoteStore(
          new NodeJSFileStore(),
          new NoteMetadataStore(),
          URI.file(wsRoot)
        );

        const engineNotes = await engine.findNotesMeta({ excludeStub: false });
        engineNotes.forEach(async (noteMeta) => {
          await noteStore.writeMetadata({ key: noteMeta.id, noteMeta });
        });

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
});
