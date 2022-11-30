import { DVault, NoteUtils } from "@dendronhq/common-all";
import { note2File, tmpDir } from "@dendronhq/common-server";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import {
  NotePropsFtsTableUtils,
  parseAllNoteFilesForSqlite,
  SqliteDbFactory,
} from "@dendronhq/engine-server";
import { Database } from "sqlite3";
import {
  SqliteTableNames,
  SqliteTestUtils,
} from "../../../utils/SqliteTestUtils";

describe("GIVEN a sqlite store about to be initialized", () => {
  jest.setTimeout(10e6);

  let db: Database;

  const testDir = tmpDir().name;
  const testVault: DVault = {
    name: "testVault",
    fsPath: ".",
    selfContained: false,
  };

  beforeAll(() => {
    return Promise.all([
      // Basic Notes
      NoteTestUtilsV4.createNote({
        vault: testVault,
        wsRoot: testDir,
        fname: "a",
      }),
      NoteTestUtilsV4.createNote({
        vault: testVault,
        wsRoot: testDir,
        fname: "b",
      }),
      NoteTestUtilsV4.createNote({
        vault: testVault,
        wsRoot: testDir,
        fname: "a.ch1",
      }),
      // Hierarchy Notes:
      NoteTestUtilsV4.createNote({
        vault: testVault,
        wsRoot: testDir,
        fname: "a.ch2",
      }),
      NoteTestUtilsV4.createNote({
        vault: testVault,
        wsRoot: testDir,
        fname: "a.ch3",
      }),
    ]);
  });

  beforeEach(() => {
    return SqliteDbFactory.createEmptyDB(":memory:")
      .map((_db) => {
        db = _db;
      })
      .mapErr((err) => {
        throw err;
      });
  });

  afterEach(() => {
    return new Promise<void>((resolve) => {
      if (db) {
        db.close(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  });

  // Query Tests:
  test("WHEN sqlite init is performed with a single note THEN it can be queried by fname", async () => {
    await parseAllNoteFilesForSqlite(["a.md"], testVault, db, testDir);

    const result = await NotePropsFtsTableUtils.query(db, "a");
    expect(result.isOk()).toBeTruthy();

    if (result.isOk()) {
      expect(result.value.length).toEqual(1);
      expect(result.value[0]).toEqual("a");
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(
        db,
        SqliteTableNames.NotePropsFts
      )
    ).toEqual(1);
  });

  test("WHEN sqlite init is performed with multiple notes with similar fnames THEN they can all be queried by fname", async () => {
    await parseAllNoteFilesForSqlite(
      ["a.md", "a.ch1.md", "a.ch2.md"],
      testVault,
      db,
      testDir
    );

    const result = await NotePropsFtsTableUtils.query(db, "a");
    expect(result.isOk()).toBeTruthy();

    if (result.isOk()) {
      expect(result.value.length).toEqual(3);
      expect(result.value.sort()).toEqual(["a", "a.ch1", "a.ch2"].sort());
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(
        db,
        SqliteTableNames.NotePropsFts
      )
    ).toEqual(3);
  });

  test("WHEN a note is added THEN the added note can be queried by fname", async () => {
    await parseAllNoteFilesForSqlite(["a.md"], testVault, db, testDir);

    await parseAllNoteFilesForSqlite(["a.md", "b.md"], testVault, db, testDir);

    const result = await NotePropsFtsTableUtils.query(db, "b");
    expect(result.isOk()).toBeTruthy();

    if (result.isOk()) {
      expect(result.value.length).toEqual(1);
      expect(result.value[0]).toEqual("b");
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(
        db,
        SqliteTableNames.NotePropsFts
      )
    ).toEqual(2);
  });

  test("WHEN a note is removed THEN it no longer can be queried by fname", async () => {
    await parseAllNoteFilesForSqlite(["a.md", "b.md"], testVault, db, testDir);

    // Remove B:
    await parseAllNoteFilesForSqlite(["a.md"], testVault, db, testDir);

    const result = await NotePropsFtsTableUtils.query(db, "b");
    expect(result.isOk()).toBeTruthy();

    if (result.isOk()) {
      expect(result.value.length).toEqual(0);
    }

    const resultA = await NotePropsFtsTableUtils.query(db, "a");
    expect(resultA.isOk()).toBeTruthy();

    if (resultA.isOk()) {
      expect(resultA.value.length).toEqual(1);
      expect(resultA.value[0]).toEqual("a");
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(
        db,
        SqliteTableNames.NotePropsFts
      )
    ).toEqual(1);
  });

  test("WHEN a note is updated to have a different fname THEN only the updated fname is queryable", async () => {
    await parseAllNoteFilesForSqlite(["a.md"], testVault, db, testDir);

    // Now 'change' the note with ID 'a' to have fname 'b'
    const note = NoteUtils.create({
      vault: testVault,
      created: 1,
      updated: 1,
      fname: "b",
      id: "a",
    });
    await note2File({ note, vault: testVault, wsRoot: testDir });

    await parseAllNoteFilesForSqlite(["b.md"], testVault, db, testDir);

    const resultB = await NotePropsFtsTableUtils.query(db, "b");
    expect(resultB.isOk()).toBeTruthy();

    if (resultB.isOk()) {
      expect(resultB.value.length).toEqual(1);
      expect(resultB.value[0]).toEqual("a");
    }

    const resultA = await NotePropsFtsTableUtils.query(db, "a");
    expect(resultA.isOk()).toBeTruthy();

    if (resultA.isOk()) {
      expect(resultA.value.length).toEqual(0);
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(
        db,
        SqliteTableNames.NotePropsFts
      )
    ).toEqual(1);
  });
});
