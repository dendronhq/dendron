import { DLink, NotePropsMeta } from "@dendronhq/common-all";
import {
  LinksTableRow,
  LinksTableUtils,
  NotePropsTableUtils,
  enableForeignKeys,
  SqliteErrorType,
} from "@dendronhq/engine-server";
import { Database } from "sqlite3";

describe("GIVEN a Links Sqlite Table", () => {
  let db: Database;
  beforeEach(() => {
    db = new Database(":memory:");
  });
  afterEach(() => {
    db.close();
  });

  const sourceNoteProp: NotePropsMeta = {
    id: "source",
    title: "title",
    desc: "description",
    updated: 1,
    created: 2,
    fname: "source-fname",
    links: [],
    anchors: {},
    type: "note",
    parent: null,
    children: [],
    data: undefined,
    custom: { custom: "custom" },
    color: "color",
    vault: {
      name: undefined,
      fsPath: "",
    },
  };

  const sinkNoteProp: NotePropsMeta = {
    id: "sink",
    title: "title",
    desc: "description",
    updated: 1,
    created: 2,
    fname: "sink-fname",
    links: [],
    anchors: {},
    type: "note",
    parent: null,
    children: [],
    data: undefined,
    custom: { custom: "custom" },
    color: "color",
    vault: {
      name: undefined,
      fsPath: "",
    },
  };

  async function setupDb() {
    await enableForeignKeys(db);
    await NotePropsTableUtils.createTable(db);
    await NotePropsTableUtils.insert(db, sourceNoteProp);
    await NotePropsTableUtils.insert(db, sinkNoteProp);
    await LinksTableUtils.createTable(db);
  }

  // Insertion Tests
  test("WHEN a forward links row is inserted THEN it can be retrieved through getAllDLinks", async () => {
    await setupDb();

    const payload: DLink = {
      type: "wiki",
      value: "",
      from: {
        fname: undefined,
        id: undefined,
        vaultName: undefined,
        uri: undefined,
        anchorHeader: undefined,
      },
    };

    const linksRow: LinksTableRow = {
      source: "source",
      sink: "sink",
      type: "wiki",
      payload,
    };

    const insertResult = await LinksTableUtils.insert(db, linksRow);
    expect(insertResult.isErr()).toBeFalsy();

    const getLinksResult = await LinksTableUtils.getAllDLinks(db, "source");

    getLinksResult
      .mapErr((e) => {
        fail(e);
      })
      .map((links) => {
        expect(links.length).toEqual(1);

        expect(links[0]).toEqual(payload);
      });
  });

  test("WHEN a links row is inserted that contains ids not present in NoteProps table THEN the appropriate error is returned", async () => {
    await setupDb();

    const payload: DLink = {
      type: "wiki",
      value: "",
      from: {
        fname: undefined,
        id: undefined,
        vaultName: undefined,
        uri: undefined,
        anchorHeader: undefined,
      },
    };

    const invalidSourceRow: LinksTableRow = {
      source: "invalid-source",
      sink: "sink",
      type: "wiki",
      payload,
    };

    const insertResult = await LinksTableUtils.insert(db, invalidSourceRow);
    expect(insertResult.isErr()).toBeTruthy();
    insertResult.mapErr((e) => {
      expect(e.type).toEqual(SqliteErrorType.ForeignKeyConstraintViolation);
    });

    const invalidSinkRow: LinksTableRow = {
      source: "source",
      sink: "invalid-sink",
      type: "wiki",
      payload,
    };

    const insertResultTwo = await LinksTableUtils.insert(db, invalidSinkRow);
    expect(insertResultTwo.isErr()).toBeTruthy();
    insertResultTwo.mapErr((e) => {
      expect(e.type).toEqual(SqliteErrorType.ForeignKeyConstraintViolation);
    });
  });

  test("WHEN inserting data with insertLinkWithSinkAsFname() THEN the appropriate forward link can be retrieved", async () => {
    await setupDb();

    const payload: DLink = {
      type: "wiki",
      value: "sink-fname",
      from: {
        fname: undefined,
        id: undefined,
        vaultName: undefined,
        uri: undefined,
        anchorHeader: undefined,
      },
    };

    const insertResult = await LinksTableUtils.insertLinkWithSinkAsFname(db, {
      source: "source",
      sinkFname: "sink-fname",
      type: "wiki",
      payload,
    });

    expect(insertResult.isErr()).toBeFalsy();

    const getLinksResult = await LinksTableUtils.getAllDLinks(db, "source");

    getLinksResult
      .mapErr((e) => {
        fail(e);
      })
      .map((links) => {
        expect(links.length).toEqual(1);

        expect(links[0]).toEqual(payload);
      });
  });

  test("WHEN inserting data with bulkInsertLinkWithSinkAsFname() THEN the appropriate forward links can be retrieved", async () => {
    await setupDb();

    const payload: DLink = {
      type: "wiki",
      value: "sink-fname",
      from: {
        fname: undefined,
        id: undefined,
        vaultName: undefined,
        uri: undefined,
        anchorHeader: undefined,
      },
    };

    const insertResult = await LinksTableUtils.bulkInsertLinkWithSinkAsFname(
      db,
      [
        {
          source: "source",
          sinkFname: "sink-fname",
          type: "wiki",
          payload,
        },
      ]
    );

    expect(insertResult.isErr()).toBeFalsy();

    const getLinksResult = await LinksTableUtils.getAllDLinks(db, "source");

    getLinksResult
      .mapErr((e) => {
        fail(e);
      })
      .map((links) => {
        expect(links.length).toEqual(1);

        expect(links[0]).toEqual(payload);
      });
  });

  //  Deletion Tests
  test("WHEN a key is deleted from the Links Table THEN all links with that key as a source can no longer be retrieved", async () => {
    await setupDb();

    const payload: DLink = {
      type: "wiki",
      value: "",
      from: {
        fname: undefined,
        id: undefined,
        vaultName: undefined,
        uri: undefined,
        anchorHeader: undefined,
      },
    };

    const linksRow: LinksTableRow = {
      source: "source",
      sink: "sink",
      type: "wiki",
      payload,
    };

    await LinksTableUtils.insert(db, linksRow);

    const deleteResult = await LinksTableUtils.delete(db, sourceNoteProp.id);

    expect(deleteResult.isErr()).toBeFalsy();

    const getLinksResult = await LinksTableUtils.getAllDLinks(db, "source");

    getLinksResult
      .mapErr((e) => {
        fail(e);
      })
      .map((links) => {
        expect(links.length).toEqual(0);
      });

    // TODO: Also test deletion of parent-child links
  });

  test("WHEN a row is deleted from NoteProps THEN the corresponding rows are also deleted from the Links Table", async () => {
    await setupDb();

    const payload: DLink = {
      type: "wiki",
      value: "",
      from: {
        fname: undefined,
        id: undefined,
        vaultName: undefined,
        uri: undefined,
        anchorHeader: undefined,
      },
    };

    const linksRow: LinksTableRow = {
      source: "source",
      sink: "sink",
      type: "wiki",
      payload,
    };

    await LinksTableUtils.insert(db, linksRow);

    await NotePropsTableUtils.delete(db, "source");

    const getLinksResult = await LinksTableUtils.getAllDLinks(db, "source");

    getLinksResult
      .mapErr((e) => {
        fail(e);
      })
      .map((links) => {
        expect(links.length).toEqual(0);
      });
  });
});
