import { NotePropsMeta } from "@dendronhq/common-all";
import {
  enableForeignKeys,
  NotePropsTableUtils,
  VaultNotesTableUtils,
  VaultsTableRow,
  VaultsTableUtils,
} from "@dendronhq/engine-server";
import { Database } from "sqlite3";

describe("GIVEN a Vault-Notes Sqlite Table", () => {
  let db: Database;
  beforeEach(() => {
    db = new Database(":memory:");
  });
  afterEach(() => {
    db.close();
  });

  const testVaultA: Omit<VaultsTableRow, "id"> = {
    name: "name-A",
    fsPath: "fsPath-A",
  };

  const testVaultB: Omit<VaultsTableRow, "id"> = {
    name: "name-B",
    fsPath: "fsPath-B",
  };

  const noteA: NotePropsMeta = {
    id: "noteA",
    title: "title",
    desc: "description",
    updated: 1,
    created: 2,
    fname: "fname",
    links: [],
    anchors: {},
    type: "note",
    parent: null,
    children: [],
    data: undefined,
    custom: { custom: "custom" },
    color: "color",
    vault: testVaultA,
  };

  const noteB: NotePropsMeta = {
    id: "noteB",
    title: "title",
    desc: "description",
    updated: 1,
    created: 2,
    fname: "fname",
    links: [],
    anchors: {},
    type: "note",
    parent: null,
    children: [],
    data: undefined,
    custom: { custom: "custom" },
    color: "color",
    vault: testVaultB,
  };

  async function setupDb() {
    await enableForeignKeys(db);

    await NotePropsTableUtils.createTable(db);
    await NotePropsTableUtils.insert(db, noteA);
    await NotePropsTableUtils.insert(db, noteB);

    await VaultsTableUtils.createTable(db);
    await VaultsTableUtils.insert(db, testVaultA);
    await VaultsTableUtils.insert(db, testVaultB);
  }

  test("WHEN a Vault-Notes row is inserted THEN it can be retrieved", async () => {
    await setupDb();

    const createResult = await VaultNotesTableUtils.createTable(db);
    expect(createResult.isErr()).toBeFalsy();

    const insertResult = await VaultNotesTableUtils.insert(db, {
      vaultId: 1,
      noteId: "noteA",
    });
    expect(insertResult.isErr()).toBeFalsy();

    const getResult = await VaultNotesTableUtils.getVaultFsPathForNoteId(
      db,
      "noteA"
    );

    getResult
      .mapErr((e) => {
        fail(e);
      })
      .map((vaultFs) => {
        expect(vaultFs).toEqual("fsPath-A");
      });
  });

  test("WHEN a duplicate Vault-Notes row is inserted THEN an error is returned and the row is not duplicated", async () => {
    await setupDb();

    await VaultNotesTableUtils.createTable(db);

    await VaultNotesTableUtils.insert(db, {
      vaultId: 1,
      noteId: "noteA",
    });

    const insertResult = await VaultNotesTableUtils.insert(db, {
      vaultId: 1,
      noteId: "noteA",
    });
    expect(insertResult.isErr()).toBeTruthy();
  });

  test("WHEN a Vault-Notes row with an invalid vault is inserted THEN the appropriate error is returned", async () => {
    await setupDb();

    await VaultNotesTableUtils.createTable(db);

    const insertResult = await VaultNotesTableUtils.insert(db, {
      vaultId: 100,
      noteId: "noteA",
    });

    expect(insertResult.isErr()).toBeTruthy();
  });

  test("WHEN a Vault-Notes row with an invalid note is inserted THEN the appropriate error is returned", async () => {
    await setupDb();

    await VaultNotesTableUtils.createTable(db);

    const insertResult = await VaultNotesTableUtils.insert(db, {
      vaultId: 1,
      noteId: "invalid-note-id",
    });

    expect(insertResult.isErr()).toBeTruthy();
  });

  // Delete Vault not yet implemented.
  test.skip("WHEN a Vault is deleted from the Vault Table THEN rows with that vault are also deleted from the Vault-Notes table", async () => {
    await setupDb();

    await VaultNotesTableUtils.createTable(db);

    await VaultNotesTableUtils.insert(db, {
      vaultId: 1,
      noteId: "noteA",
    });

    await VaultNotesTableUtils.insert(db, {
      vaultId: 2,
      noteId: "noteB",
    });

    // VaultsTableUtils.delete();
  });

  test("WHEN a Note is deleted from the NoteProps Table THEN rows with that Note are also deleted from the Vault-Notes table", async () => {
    await setupDb();
    await VaultNotesTableUtils.createTable(db);

    await VaultNotesTableUtils.insert(db, {
      vaultId: 1,
      noteId: "noteA",
    });

    await VaultNotesTableUtils.insert(db, {
      vaultId: 2,
      noteId: "noteB",
    });

    await NotePropsTableUtils.delete(db, "noteA");

    const getResultForDeletedNote =
      await VaultNotesTableUtils.getVaultFsPathForNoteId(db, "noteA");

    getResultForDeletedNote.mapErr((e) => {
      expect(e.message).toEqual(
        "No note or vault found for note with ID noteA"
      );
    });

    const getResultForStillExistingNote =
      await VaultNotesTableUtils.getVaultFsPathForNoteId(db, "noteB");

    getResultForStillExistingNote
      .mapErr((e) => {
        fail(e);
      })
      .map((fsPath) => {
        expect(fsPath).toEqual("fsPath-B");
      });
  });
});
