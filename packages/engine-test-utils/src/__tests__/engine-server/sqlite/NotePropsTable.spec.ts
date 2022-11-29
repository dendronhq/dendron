import { NotePropsMeta } from "@dendronhq/common-all";
import { NotePropsTableUtils } from "@dendronhq/engine-server";
import { Database } from "sqlite3";

describe("GIVEN a NoteProps Sqlite Table", () => {
  let db: Database;
  beforeEach(() => {
    db = new Database(":memory:");
  });
  afterEach(() => {
    db.close();
  });

  const testNoteProp: NotePropsMeta = {
    id: "id",
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
    contentHash: "contentHash",
    color: "color",
    vault: {
      name: undefined,
      fsPath: "",
    },
  };

  const updatedNoteProp: NotePropsMeta = {
    id: "id",
    title: "updated-title",
    desc: "updated-description",
    updated: 10,
    created: 11,
    fname: "updated-fname",
    links: [],
    anchors: {},
    type: "note",
    parent: null,
    children: [],
    data: undefined,
    custom: { custom: "custom" },
    contentHash: "contentHash",
    color: "color",
    vault: {
      name: undefined,
      fsPath: "",
    },
  };

  test("WHEN a NotePropMeta is inserted THEN it can be retrieved", async () => {
    await NotePropsTableUtils.createTable(db);

    await NotePropsTableUtils.insert(db, testNoteProp);

    const dbResult = await NotePropsTableUtils.getById(db, "id");

    dbResult
      .mapErr((e) => {
        fail(e);
      })
      .map((row) => {
        if (!row) {
          fail(`Unable to find row with ID "id" from database`);
        }
        expect(row.id).toEqual("id");
        expect(row.fname).toEqual("fname");
        expect(row.title).toEqual("title");
        expect(row.description).toEqual("description");
        expect(row.updated).toEqual(1);
        expect(row.created).toEqual(2);
        expect(row.anchors).toEqual("{}");
        expect(row.stub).toEqual(0);
        expect(JSON.parse(row.custom)).toEqual({ custom: "custom" });
        expect(row.contentHash).toEqual("contentHash");
        expect(row.color).toEqual("color");
        expect(row.image).toEqual(null);
        expect(row.traits).toEqual(null);
      });
  });

  test("WHEN a non-existing ID is called in getById NotePropMeta THEN the appropriate error is returned", async () => {
    await NotePropsTableUtils.createTable(db);

    const dbResult = await NotePropsTableUtils.getById(db, "imaginary-id");

    expect(dbResult.isOk()).toBeTruthy();

    dbResult.map((row) => {
      expect(row).toEqual(null);
    });
  });

  test("WHEN NotePropMeta is inserted as an update THEN the updated row is retrieved", async () => {
    await NotePropsTableUtils.createTable(db);

    await NotePropsTableUtils.insert(db, testNoteProp);
    await NotePropsTableUtils.insert(db, updatedNoteProp);

    const dbResult = await NotePropsTableUtils.getById(db, "id");

    dbResult
      .mapErr((e) => {
        fail(e);
      })
      .map((row) => {
        if (!row) {
          fail(`Unable to find row with ID "id" from database`);
        }
        expect(row.id).toEqual("id");
        expect(row.fname).toEqual("updated-fname");
        expect(row.title).toEqual("updated-title");
        expect(row.description).toEqual("updated-description");
        expect(row.updated).toEqual(10);
        expect(row.created).toEqual(11);
      });
  });

  test("WHEN a row is deleted THEN the row can no longer be retrieved", async () => {
    await NotePropsTableUtils.createTable(db);
    await NotePropsTableUtils.insert(db, testNoteProp);

    const deleteResult = await NotePropsTableUtils.delete(db, testNoteProp.id);
    expect(deleteResult.isErr()).toBeFalsy();

    const getResult = await NotePropsTableUtils.getById(db, testNoteProp.id);
    expect(getResult.isOk()).toBeTruthy();

    getResult.map((noteProps) => {
      expect(noteProps).toEqual(null);
    });
  });
});
