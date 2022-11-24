import { NotePropsMeta } from "@dendronhq/common-all";
import {
  enableForeignKeys,
  HierarchyTableUtils,
  NotePropsTableUtils,
  VaultNotesTableUtils,
  VaultsTableRow,
  VaultsTableUtils,
} from "@dendronhq/engine-server";
import { Database } from "sqlite3";

describe("GIVEN a Hierarchy Sqlite Table", () => {
  let db: Database;
  beforeEach(() => {
    db = new Database(":memory:");
  });
  afterEach(() => {
    db.close();
  });

  async function setupDb() {
    const testVaultA: Omit<VaultsTableRow, "id"> = {
      name: "name-A",
      fsPath: "fsPath-A",
    };

    const testVaultB: Omit<VaultsTableRow, "id"> = {
      name: "name-B",
      fsPath: "fsPath-B",
    };

    // Vault A; Parent Note
    const aParent: NotePropsMeta = {
      id: "id-a.parent",
      title: "title",
      desc: "description",
      updated: 1,
      created: 2,
      fname: "parent",
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

    const aChild: NotePropsMeta = {
      id: "id-a.child",
      title: "title",
      desc: "description",
      updated: 1,
      created: 2,
      fname: "parent.child",
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

    const aChildTwo: NotePropsMeta = {
      id: "id-a.child-two",
      title: "title",
      desc: "description",
      updated: 1,
      created: 2,
      fname: "parent.childtwo",
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

    // B Vault, identical fname to aParent
    const bParent: NotePropsMeta = {
      id: "id-b.parent",
      title: "title",
      desc: "description",
      updated: 1,
      created: 2,
      fname: "parent",
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

    // B Vault, identical fname to aChild
    const bChild: NotePropsMeta = {
      id: "id-b.child",
      title: "title",
      desc: "description",
      updated: 1,
      created: 2,
      fname: "parent.child",
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

    await enableForeignKeys(db);
    await NotePropsTableUtils.createTable(db);
    await NotePropsTableUtils.insert(db, aParent);
    await NotePropsTableUtils.insert(db, aChild);
    await NotePropsTableUtils.insert(db, aChildTwo);
    await NotePropsTableUtils.insert(db, bParent);
    await NotePropsTableUtils.insert(db, bChild);

    await VaultsTableUtils.createTable(db);
    await VaultsTableUtils.insert(db, testVaultA);
    await VaultsTableUtils.insert(db, testVaultB);

    await VaultNotesTableUtils.createTable(db);

    await VaultNotesTableUtils.insert(db, {
      vaultId: 1,
      noteId: "id-a.parent",
    });

    await VaultNotesTableUtils.insert(db, {
      vaultId: 1,
      noteId: "id-a.child",
    });

    await VaultNotesTableUtils.insert(db, {
      vaultId: 1,
      noteId: "id-a.child-two",
    });

    await VaultNotesTableUtils.insert(db, {
      vaultId: 2,
      noteId: "id-b.parent",
    });

    await VaultNotesTableUtils.insert(db, {
      vaultId: 2,
      noteId: "id-b.child",
    });

    await HierarchyTableUtils.createTable(db);
  }

  test("WHEN inserting data with insertWithParentAsFname() THEN the appropriate parent-child link can be retrieved", async () => {
    await setupDb();

    const insertResult = await HierarchyTableUtils.insertWithParentAsFname(
      db,
      "id-a.child",
      "parent",
      1
    );

    expect(insertResult.isErr()).toBeFalsy();

    const getParentResult = await HierarchyTableUtils.getParent(
      db,
      "id-a.child"
    );

    getParentResult
      .mapErr((e) => {
        fail(e);
      })
      .map((parent) => {
        expect(parent).toEqual("id-a.parent");
      });

    const getChildResult = await HierarchyTableUtils.getChildren(
      db,
      "id-a.parent"
    );

    getChildResult
      .mapErr((e) => {
        fail(e);
      })
      .map((children) => {
        expect(children.length).toEqual(1);
        expect(children[0]).toEqual("id-a.child");
      });
  });

  test("WHEN inserting data with bulkInsertWithParentAsFname() THEN the appropriate parent-child links can be retrieved", async () => {
    await setupDb();

    const insertResult = await HierarchyTableUtils.bulkInsertWithParentAsFname(
      db,
      [
        { childId: "id-a.child", parentFname: "parent", vaultId: 1 },
        { childId: "id-a.child-two", parentFname: "parent", vaultId: 1 },
      ]
    );

    expect(insertResult.isErr()).toBeFalsy();

    const getParentResult = await HierarchyTableUtils.getParent(
      db,
      "id-a.child"
    );

    getParentResult
      .mapErr((e) => {
        fail(e);
      })
      .map((parent) => {
        expect(parent).toEqual("id-a.parent");
      });

    const getParentResultTwo = await HierarchyTableUtils.getParent(
      db,
      "id-a.child-two"
    );

    getParentResultTwo
      .mapErr((e) => {
        fail(e);
      })
      .map((parent) => {
        expect(parent).toEqual("id-a.parent");
      });

    const getChildResult = await HierarchyTableUtils.getChildren(
      db,
      "id-a.parent"
    );

    getChildResult
      .mapErr((e) => {
        fail(e);
      })
      .map((children) => {
        expect(children.length).toEqual(2);

        expect(children.includes("id-a.child")).toBeTruthy();
        expect(children.includes("id-a.child-two")).toBeTruthy();
      });
  });

  test("WHEN a row is deleted from NoteProps THEN the corresponding rows are also deleted from the Links Table", async () => {
    await setupDb();

    await HierarchyTableUtils.bulkInsertWithParentAsFname(db, [
      { childId: "id-a.child", parentFname: "parent", vaultId: 1 },
      { childId: "id-a.child-two", parentFname: "parent", vaultId: 1 },
    ]);

    await NotePropsTableUtils.delete(db, "id-a.child-two");

    const getParentResult = await HierarchyTableUtils.getParent(
      db,
      "id-a.child"
    );

    getParentResult
      .mapErr((e) => {
        fail(e);
      })
      .map((parent) => {
        expect(parent).toEqual("id-a.parent");
      });

    const getChildResult = await HierarchyTableUtils.getChildren(
      db,
      "id-a.parent"
    );

    getChildResult
      .mapErr((e) => {
        fail(e);
      })
      .map((children) => {
        expect(children.length).toEqual(1);
        expect(children[0]).toEqual("id-a.child");
      });
  });

  test("WHEN two vaults both have parents and children with the same fnames THEN the get children/parent retrieves the note(s) from the correct vault", async () => {
    await setupDb();

    await HierarchyTableUtils.insertWithParentAsFname(
      db,
      "id-a.child",
      "parent",
      1
    );

    await HierarchyTableUtils.insertWithParentAsFname(
      db,
      "id-b.child",
      "parent",
      2
    );

    const getParentResult = await HierarchyTableUtils.getParent(
      db,
      "id-a.child"
    );

    getParentResult
      .mapErr((e) => {
        fail(e);
      })
      .map((parent) => {
        expect(parent).toEqual("id-a.parent");
      });

    const getChildResult = await HierarchyTableUtils.getChildren(
      db,
      "id-a.parent"
    );

    getChildResult
      .mapErr((e) => {
        fail(e);
      })
      .map((children) => {
        expect(children.length).toEqual(1);
        expect(children[0]).toEqual("id-a.child");
      });

    const getParentBResult = await HierarchyTableUtils.getParent(
      db,
      "id-b.child"
    );

    getParentBResult
      .mapErr((e) => {
        fail(e);
      })
      .map((parent) => {
        expect(parent).toEqual("id-b.parent");
      });

    const getChildBResult = await HierarchyTableUtils.getChildren(
      db,
      "id-b.parent"
    );

    getChildBResult
      .mapErr((e) => {
        fail(e);
      })
      .map((children) => {
        expect(children.length).toEqual(1);
        expect(children[0]).toEqual("id-b.child");
      });
  });
});
