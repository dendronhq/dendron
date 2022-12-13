import { DVault, NoteUtils, Position, Ok } from "@dendronhq/common-all";
import { note2File, tmpDir } from "@dendronhq/common-server";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import {
  HierarchyTableUtils,
  LinksTableUtils,
  NotePropsTableRow,
  NotePropsTableUtils,
  parseAllNoteFilesForSqlite,
  SqliteDbFactory,
  VaultNotesTableUtils,
  VaultsTableUtils,
} from "@dendronhq/engine-server";
import fs from "fs-extra";
import path from "path";
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

  const testVaultTwo: DVault = {
    name: "testVaultTwo",
    fsPath: "testVaultTwo",
    selfContained: false,
  };

  const testVaultThree: DVault = {
    name: "testVaultThree",
    fsPath: "testVaultThree",
    selfContained: false,
  };

  beforeAll(() => {
    // Create the test vault directories:
    fs.ensureDirSync(path.join(testDir, testVaultTwo.fsPath));
    fs.ensureDirSync(path.join(testDir, testVaultThree.fsPath));

    return Promise.all([
      // Special Root Note
      NoteTestUtilsV4.createNote({
        vault: testVault,
        wsRoot: testDir,
        fname: "root",
      }),
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
        fname: "c",
      }),
      // Hierarchy Notes:
      NoteTestUtilsV4.createNote({
        vault: testVault,
        wsRoot: testDir,
        fname: "a.ch1",
      }),
      NoteTestUtilsV4.createNote({
        vault: testVault,
        wsRoot: testDir,
        fname: "a.ch1.gch1",
      }),

      // Notes with Links
      NoteTestUtilsV4.createNote({
        vault: testVault,
        wsRoot: testDir,
        fname: "wikilink-a",
        body: "[[a]]",
      }),
      NoteTestUtilsV4.createNote({
        vault: testVault,
        wsRoot: testDir,
        fname: "noteref-a",
        body: "![[a]]",
      }),
      NoteTestUtilsV4.createNote({
        vault: testVault,
        wsRoot: testDir,
        fname: "link-candidate",
        body: "a",
      }),
      NoteTestUtilsV4.createNote({
        vault: testVault,
        wsRoot: testDir,
        fname: "unresolved-wikilink",
        body: "[[points-to-nowhere]]",
      }),
      NoteTestUtilsV4.createNote({
        vault: testVault,
        wsRoot: testDir,
        fname: "wikilink-to-self",
        body: "[[wikilink-to-self]]",
      }),

      // Basic Note in Second Vault
      NoteTestUtilsV4.createNote({
        vault: testVaultTwo,
        wsRoot: testDir,
        fname: "vault-two-note",
      }),

      // Same fname as in Vault 1
      NoteTestUtilsV4.createNote({
        vault: testVaultTwo,
        wsRoot: testDir,
        fname: "a",
        id: "a-vault-two",
      }),

      NoteTestUtilsV4.createNote({
        vault: testVaultTwo,
        wsRoot: testDir,
        fname: "cross-vault-link",
        body: "[[b]]",
      }),

      NoteTestUtilsV4.createNote({
        vault: testVaultTwo,
        wsRoot: testDir,
        fname: "cross-vault-link-candidate",
        body: "b",
      }),

      NoteTestUtilsV4.createNote({
        vault: testVaultTwo,
        wsRoot: testDir,
        fname: "cross-vault-link-with-vault-qualifier",
        body: "[[dendron://testVaultThree/a]]",
      }),

      NoteTestUtilsV4.createNote({
        vault: testVaultTwo,
        wsRoot: testDir,
        fname: "cross-vault-link-ambiguous",
        body: "[[a]]",
      }),

      // 3-time replicated note name "a" in third vault
      NoteTestUtilsV4.createNote({
        vault: testVaultThree,
        wsRoot: testDir,
        fname: "a",
        id: "a-vault-three",
      }),
    ]);
  });

  beforeEach(() => {
    // If you need to debug locally, change this to a fully qualified file path.
    // You can then connect to the db file to examine table state.
    return (
      SqliteDbFactory.createEmptyDB(":memory:")
        // SqliteDbFactory.createEmptyDB(
        //   "/Users/jyeung/code/dendron/dendron/dendron.test4.db"
        // )
        .map((_db) => {
          db = _db;
        })
        .mapErr((err) => {
          throw err;
        })
    );
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

  // Vault Setup Tests:
  test("WHEN sqlite init is performed with a single vault THEN vault is present in the Vaults table", async () => {
    await parseAllNoteFilesForSqlite(["a.md"], testVault, db, testDir);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Vaults)
    ).toEqual(1);
  });

  test("WHEN sqlite init is performed over multiple vaults THEN all vaults are present in the Vaults table", async () => {
    await parseAllNoteFilesForSqlite(["a.md"], testVault, db, testDir);
    await parseAllNoteFilesForSqlite(
      ["vault-two-note.md"],
      testVaultTwo,
      db,
      path.join(testDir, testVaultTwo.fsPath)
    );

    const result = await VaultsTableUtils.getIdByFsPath(db, ".");

    expect(result.isOk()).toBeTruthy();

    const resultTwo = await VaultsTableUtils.getIdByFsPath(db, "testVaultTwo");
    expect(resultTwo.isOk()).toBeTruthy();

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Vaults)
    ).toEqual(2);
  });

  // Note Setup Tests:
  test("WHEN initializing an empty workspace THEN initialization still succeeds and the database is empty", async () => {
    const response = await parseAllNoteFilesForSqlite(
      [],
      testVault,
      db,
      testDir
    );

    expect(response.isOk()).toBeTruthy();

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(0);
  });

  test("WHEN sqlite init is performed on a simple note THEN note is present in the NoteProps and VaultNotes tables", async () => {
    await parseAllNoteFilesForSqlite(["a.md"], testVault, db, testDir);

    await validateNotePropInDB(db, "a", testVault);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(1);
  });

  test("WHEN sqlite init is done multiple times THEN subsequent inits don't affect DB state", async () => {
    // Run twice:
    await parseAllNoteFilesForSqlite(["a.md"], testVault, db, testDir);
    await parseAllNoteFilesForSqlite(["a.md"], testVault, db, testDir);

    await validateNotePropInDB(db, "a", testVault);

    const rowCount = await SqliteTestUtils.getRowCountForTable(
      db,
      SqliteTableNames.NoteProps
    );
    expect(rowCount).toEqual(1);
  });

  test("WHEN a new note is added to file system THEN the new note is added to NoteProps and VaultNotes tables", async () => {
    // Set the initial DB state:
    await parseAllNoteFilesForSqlite(["a.md"], testVault, db, testDir);

    // Now a second note is added 'offline', and the DB gets initialized again:
    await parseAllNoteFilesForSqlite(["a.md", "b.md"], testVault, db, testDir);

    await validateNotePropInDB(db, "a", testVault);
    await validateNotePropInDB(db, "b", testVault);

    const rowCount = await SqliteTestUtils.getRowCountForTable(
      db,
      SqliteTableNames.NoteProps
    );

    expect(rowCount).toEqual(2);
  });

  test("WHEN many new notes are added to file system THEN all the new notes are added to NoteProps and VaultNotes tables", async () => {
    // Set the initial DB state:
    await parseAllNoteFilesForSqlite(["a.md"], testVault, db, testDir);

    // Now multiple notes are added 'offline', and the DB gets initialized again:
    await parseAllNoteFilesForSqlite(
      ["a.md", "b.md", "c.md"],
      testVault,
      db,
      testDir
    );

    await validateNotePropInDB(db, "a", testVault);
    await validateNotePropInDB(db, "b", testVault);
    await validateNotePropInDB(db, "c", testVault);

    const rowCount = await SqliteTestUtils.getRowCountForTable(
      db,
      SqliteTableNames.NoteProps
    );

    expect(rowCount).toEqual(3);
  });

  // Forward Links Tests:
  test("WHEN a note with a wikilink is added THEN an entry is added to the links table", async () => {
    // Set the initial DB state:
    await parseAllNoteFilesForSqlite(
      ["a.md", "wikilink-a.md"],
      testVault,
      db,
      testDir
    );

    await validateNotePropInDB(db, "a", testVault);
    await validateNotePropInDB(db, "wikilink-a", testVault);

    const result = await LinksTableUtils.getAllDLinks(db, "wikilink-a");
    expect(result.isOk()).toBeTruthy();

    let wikilinkPosition;
    if (result.isOk()) {
      expect(result.value.length).toEqual(1);

      const wikilink = result.value[0];
      expect(wikilink.type).toEqual("wiki");
      expect(wikilink.value).toEqual("a");
      expect(wikilink.from.id).toEqual("wikilink-a");
      expect(wikilink.to?.fname).toEqual("a");
      wikilinkPosition = wikilink.position;
    }

    // Validate backlink:
    const backlinkResult = await LinksTableUtils.getAllDLinks(db, "a");
    expect(backlinkResult.isOk()).toBeTruthy();

    if (backlinkResult.isOk()) {
      expect(backlinkResult.value.length).toEqual(1);

      const backlink = backlinkResult.value[0];
      expect(backlink.type).toEqual("backlink");
      expect(backlink.value).toEqual("a");
      expect(backlink.from.id).toEqual("wikilink-a");
      expect(backlink.from.fname).toEqual("wikilink-a");
      expect(backlink.from.vaultName).toEqual("testVault");
      expect(backlink.position).toEqual(wikilinkPosition);
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(2);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Links)
    ).toEqual(1);
  });

  test("WHEN a note with a wikilink to itself THEN an entry is added to the links table", async () => {
    // Set the initial DB state:
    await parseAllNoteFilesForSqlite(
      ["wikilink-to-self.md"],
      testVault,
      db,
      testDir
    );

    await validateNotePropInDB(db, "wikilink-to-self", testVault);

    const result = await LinksTableUtils.getAllDLinks(db, "wikilink-to-self");

    expect(result.isOk()).toBeTruthy();

    if (result.isOk()) {
      expect(result.value.length).toEqual(1);

      const wikilink = result.value[0];
      expect(wikilink.type).toEqual("wiki");
      expect(wikilink.value).toEqual("wikilink-to-self");
      expect(wikilink.from.id).toEqual("wikilink-to-self");
      expect(wikilink.to?.fname).toEqual("wikilink-to-self");
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(1);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Links)
    ).toEqual(1);
  });

  test("WHEN a note with a note ref is added THEN an entry is added to the links table", async () => {
    // Set the initial DB state:
    await parseAllNoteFilesForSqlite(
      ["a.md", "noteref-a.md"],
      testVault,
      db,
      testDir
    );
    await validateNotePropInDB(db, "a", testVault);
    await validateNotePropInDB(db, "noteref-a", testVault);

    const result = await LinksTableUtils.getAllDLinks(db, "noteref-a");
    expect(result.isOk()).toBeTruthy();

    if (result.isOk()) {
      expect(result.value.length).toEqual(1);

      const wikilink = result.value[0];
      expect(wikilink.type).toEqual("ref");
      expect(wikilink.value).toEqual("a");
      expect(wikilink.from.id).toEqual("noteref-a");
      expect(wikilink.to?.fname).toEqual("a");
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(2);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Links)
    ).toEqual(1);
  });

  test("WHEN a note with a note candidate is added THEN an entry is added to the links table", async () => {
    // Set the initial DB state:
    await parseAllNoteFilesForSqlite(
      ["a.md", "link-candidate.md"],
      testVault,
      db,
      testDir,
      true // enableLinkCandidates
    );

    await validateNotePropInDB(db, "a", testVault);
    await validateNotePropInDB(db, "link-candidate", testVault);

    const result = await LinksTableUtils.getAllDLinks(db, "link-candidate");
    expect(result.isOk()).toBeTruthy();

    if (result.isOk()) {
      expect(result.value.length).toEqual(1);

      const wikilink = result.value[0];
      expect(wikilink.type).toEqual("linkCandidate");
      expect(wikilink.value).toEqual("a");
      expect(wikilink.from.id).toEqual("link-candidate");
      expect(wikilink.to?.fname).toEqual("a");
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(2);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Links)
    ).toEqual(1);
  });

  test("WHEN a note with an unresolved wikilink is added THEN an entry is still added to the links table", async () => {
    // Set the initial DB state:
    await parseAllNoteFilesForSqlite(
      ["a.md", "unresolved-wikilink.md"],
      testVault,
      db,
      testDir
    );

    await validateNotePropInDB(db, "a", testVault);
    await validateNotePropInDB(db, "unresolved-wikilink", testVault);

    const result = await LinksTableUtils.getAllDLinks(
      db,
      "unresolved-wikilink"
    );
    expect(result.isOk()).toBeTruthy();

    if (result.isOk()) {
      expect(result.value.length).toEqual(1);

      const wikilink = result.value[0];
      expect(wikilink.type).toEqual("wiki");
      expect(wikilink.value).toEqual("points-to-nowhere");
      expect(wikilink.from.id).toEqual("unresolved-wikilink");
      expect(wikilink.to?.fname).toEqual("points-to-nowhere");
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(2);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Links)
    ).toEqual(1);
  });

  test("WHEN a note with an unresolved wikilink is added AND the wikilink is later resolved THEN the entry in the links table has source and sinks properly populated", async () => {
    // Set the initial DB state. Wikilink-a is unresolved.
    await parseAllNoteFilesForSqlite(["wikilink-a.md"], testVault, db, testDir);

    // Now it gets resolved since a got added.
    await parseAllNoteFilesForSqlite(
      ["a.md", "wikilink-a.md"],
      testVault,
      db,
      testDir
    );

    await validateNotePropInDB(db, "a", testVault);
    await validateNotePropInDB(db, "wikilink-a", testVault);

    const result = await LinksTableUtils.getAllDLinks(db, "wikilink-a");
    expect(result.isOk()).toBeTruthy();

    let wikilinkPosition;
    if (result.isOk()) {
      expect(result.value.length).toEqual(1);

      const wikilink = result.value[0];
      expect(wikilink.type).toEqual("wiki");
      expect(wikilink.value).toEqual("a");
      expect(wikilink.from.id).toEqual("wikilink-a");
      expect(wikilink.to?.fname).toEqual("a");
      wikilinkPosition = wikilink.position;
    }

    // Validate backlink:
    const backlinkResult = await LinksTableUtils.getAllDLinks(db, "a");
    expect(backlinkResult.isOk()).toBeTruthy();

    if (backlinkResult.isOk()) {
      expect(backlinkResult.value.length).toEqual(1);

      const backlink = backlinkResult.value[0];
      expect(backlink.type).toEqual("backlink");
      expect(backlink.value).toEqual("a");
      expect(backlink.from.id).toEqual("wikilink-a");
      expect(backlink.from.fname).toEqual("wikilink-a");
      expect(backlink.from.vaultName).toEqual("testVault");
      expect(backlink.position).toEqual(wikilinkPosition);
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(2);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Links)
    ).toEqual(1);
  });

  // Parent Child Link Tests:
  test("WHEN a parent and child note are added THEN a child entry is added to the hierarchy table", async () => {
    // Set the initial DB state:
    const parseResult = await parseAllNoteFilesForSqlite(
      ["a.md", "a.ch1.md"],
      testVault,
      db,
      testDir
    );

    expect(parseResult.isOk()).toBeTruthy();

    await validateNotePropInDB(db, "a", testVault);
    await validateNotePropInDB(db, "a.ch1", testVault);

    const result = await HierarchyTableUtils.getChildren(db, "a");

    if (result.isOk()) {
      expect(result.value.length).toEqual(1);

      const child = result.value[0];
      expect(child).toEqual("a.ch1");
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(2);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Hierarchy)
    ).toEqual(1);
  });

  test("WHEN parent, child, and grandchild notes are added THEN two child entries are added to the hierarchy table", async () => {
    // Set the initial DB state:
    await parseAllNoteFilesForSqlite(
      ["a.md", "a.ch1.md", "a.ch1.gch1.md"],
      testVault,
      db,
      testDir
    );

    await validateNotePropInDB(db, "a", testVault);
    await validateNotePropInDB(db, "a.ch1", testVault);
    await validateNotePropInDB(db, "a.ch1.gch1", testVault);

    const result = await HierarchyTableUtils.getChildren(db, "a");

    if (result.isOk()) {
      expect(result.value.length).toEqual(1);

      const child = result.value[0];
      expect(child).toEqual("a.ch1");
    }

    const resultTwo = await HierarchyTableUtils.getChildren(db, "a.ch1");

    if (resultTwo.isOk()) {
      expect(resultTwo.value.length).toEqual(1);

      const child = resultTwo.value[0];
      expect(child).toEqual("a.ch1.gch1");
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(3);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Hierarchy)
    ).toEqual(2);
  });

  test("WHEN a root note is present THEN all top level notes appear as root children in the Hierarchy Table", async () => {
    // Set the initial DB state:
    await parseAllNoteFilesForSqlite(
      ["root.md", "a.md", "b.md", "c.md"],
      testVault,
      db,
      testDir
    );

    await validateNotePropInDB(db, "root", testVault);
    await validateNotePropInDB(db, "a", testVault);
    await validateNotePropInDB(db, "b", testVault);
    await validateNotePropInDB(db, "c", testVault);

    const result = await HierarchyTableUtils.getChildren(db, "root");

    expect(result.isOk()).toBeTruthy();

    if (result.isOk()) {
      expect(result.value.length).toEqual(3);

      expect(result.value[0]).toEqual("a");
      expect(result.value[1]).toEqual("b");
      expect(result.value[2]).toEqual("c");
    }

    const parentAResult = await HierarchyTableUtils.getParent(db, "a");
    expect(parentAResult.isOk()).toBeTruthy();
    if (parentAResult.isOk()) expect(parentAResult.value).toEqual("root");

    const parentBResult = await HierarchyTableUtils.getParent(db, "b");
    expect(parentBResult.isOk()).toBeTruthy();
    if (parentBResult.isOk()) expect(parentBResult.value).toEqual("root");

    const parentCResult = await HierarchyTableUtils.getParent(db, "c");
    expect(parentCResult.isOk()).toBeTruthy();
    if (parentCResult.isOk()) expect(parentCResult.value).toEqual("root");

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(4);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Hierarchy)
    ).toEqual(3);
  });

  test("WHEN parent and grandchild notes are added THEN a child is added as a stub in NoteProps and properly connected in the hierarchy table", async () => {
    // Set the initial DB state, the middle 'a.ch1.md' note is missing
    const parseResult = await parseAllNoteFilesForSqlite(
      ["a.md", "a.ch1.gch1.md"],
      testVault,
      db,
      testDir
    );

    expect(parseResult.isOk()).toBeTruthy();

    await validateNotePropInDB(db, "a", testVault);
    await validateNotePropInDB(db, "a.ch1.gch1", testVault);

    // The ID's on stub notes are random, so we need to use getByFname here.
    const byFnameResult = await NotePropsTableUtils.getByFname(db, "a.ch1");

    expect(byFnameResult.isOk()).toBeTruthy();

    let ch1Id: string | undefined;

    if (byFnameResult.isOk()) {
      expect(byFnameResult.value.length).toEqual(1);
      expect(byFnameResult.value[0].fname).toEqual("a.ch1");
      expect(byFnameResult.value[0].stub).toBeTruthy();
      ch1Id = byFnameResult.value[0].id;
    }

    const result = await HierarchyTableUtils.getChildren(db, "a");

    if (result.isOk()) {
      expect(result.value.length).toEqual(1);

      const child = result.value[0];
      expect(child).toEqual(ch1Id);
    }

    const resultTwo = await HierarchyTableUtils.getChildren(db, ch1Id!);

    if (resultTwo.isOk()) {
      expect(resultTwo.value.length).toEqual(1);

      const child = resultTwo.value[0];
      expect(child).toEqual("a.ch1.gch1");
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(3);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Hierarchy)
    ).toEqual(2);
  });

  test("WHEN parent and grandparent are both stubs THEN both are added as stubs in NoteProps and properly connected in the hierarchy table", async () => {
    // Set the initial DB state, multiple ancestors 'a.md' and 'a.ch1.md' are missing
    const parseResult = await parseAllNoteFilesForSqlite(
      ["a.ch1.gch1.md"],
      testVault,
      db,
      testDir
    );

    expect(parseResult.isOk()).toBeTruthy();

    await validateNotePropInDB(db, "a.ch1.gch1", testVault);

    // The ID's on stub notes are random, so we need to use getByFname here.
    const parentByFnameResult = await NotePropsTableUtils.getByFname(
      db,
      "a.ch1"
    );

    expect(parentByFnameResult.isOk()).toBeTruthy();

    let parentId: string | undefined;

    if (parentByFnameResult.isOk()) {
      expect(parentByFnameResult.value.length).toEqual(1);
      expect(parentByFnameResult.value[0].fname).toEqual("a.ch1");
      expect(parentByFnameResult.value[0].stub).toBeTruthy();
      parentId = parentByFnameResult.value[0].id;
    }

    const grandparentByFnameResult = await NotePropsTableUtils.getByFname(
      db,
      "a"
    );

    expect(grandparentByFnameResult.isOk()).toBeTruthy();

    let grandparentId: string | undefined;

    if (grandparentByFnameResult.isOk()) {
      expect(grandparentByFnameResult.value.length).toEqual(1);
      expect(grandparentByFnameResult.value[0].fname).toEqual("a");
      expect(grandparentByFnameResult.value[0].stub).toBeTruthy();
      grandparentId = grandparentByFnameResult.value[0].id;
    }

    const result = await HierarchyTableUtils.getChildren(db, grandparentId!);

    if (result.isOk()) {
      expect(result.value.length).toEqual(1);

      const child = result.value[0];
      expect(child).toEqual(parentId);
    }

    const resultTwo = await HierarchyTableUtils.getChildren(db, parentId!);

    if (resultTwo.isOk()) {
      expect(resultTwo.value.length).toEqual(1);

      const child = resultTwo.value[0];
      expect(child).toEqual("a.ch1.gch1");
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(3);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Hierarchy)
    ).toEqual(2);
  });

  test("WHEN a stub note gets replaced by a real note THEN the ancestral chain is properly connected in the hierarchy table", async () => {
    // Set the initial DB state, a.ch1 gets generated as a stub.
    const parseResult = await parseAllNoteFilesForSqlite(
      ["a.md", "a.ch1.gch1.md"],
      testVault,
      db,
      testDir
    );

    expect(parseResult.isOk()).toBeTruthy();

    // Now replace the a.ch1 stub with a real note
    const parseResultTwo = await parseAllNoteFilesForSqlite(
      ["a.md", "a.ch1.md", "a.ch1.gch1.md"],
      testVault,
      db,
      testDir
    );

    expect(parseResultTwo.isOk()).toBeTruthy();

    await validateNotePropInDB(db, "a", testVault);
    await validateNotePropInDB(db, "a.ch1", testVault);
    await validateNotePropInDB(db, "a.ch1.gch1", testVault);

    const result = await HierarchyTableUtils.getChildren(db, "a");

    if (result.isOk()) {
      expect(result.value.length).toEqual(1);

      const child = result.value[0];
      expect(child).toEqual("a.ch1");
    }

    const resultTwo = await HierarchyTableUtils.getChildren(db, "a.ch1");

    if (resultTwo.isOk()) {
      expect(resultTwo.value.length).toEqual(1);

      const child = resultTwo.value[0];
      expect(child).toEqual("a.ch1.gch1");
    }

    // Make sure all the stub rows are properly cleaned up:
    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(3);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Hierarchy)
    ).toEqual(2);
  });

  test("WHEN a note with parent and grandparent stubs is deleted THEN stubs in the ancestral tree also get deleted", async () => {
    // Set the initial DB state, multiple ancestors 'a.md' and 'a.ch1.md' are missing
    const parseResult = await parseAllNoteFilesForSqlite(
      ["a.ch1.gch1.md"],
      testVault,
      db,
      testDir
    );

    expect(parseResult.isOk()).toBeTruthy();

    // Now delete the grandchild note:
    const parseResultTwo = await parseAllNoteFilesForSqlite(
      [],
      testVault,
      db,
      testDir
    );

    expect(parseResultTwo.isOk()).toBeTruthy();

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(0);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Hierarchy)
    ).toEqual(0);
  });

  // Note Update Tests:
  test("WHEN a note is modified THEN the new note state is reflected in the NoteProps table", async () => {
    await parseAllNoteFilesForSqlite(["a.md"], testVault, db, testDir);

    // Now modify the note:
    await NoteTestUtilsV4.createNote({
      vault: testVault,
      wsRoot: testDir,
      fname: "a",
      custom: { test: "test" },
    });

    // Initialize again:
    await parseAllNoteFilesForSqlite(["a.md"], testVault, db, testDir);

    // The updated state should be in the DB:
    const result = await validateNotePropInDB(db, "a", testVault);
    expect(JSON.parse(result.value.custom)).toEqual({ test: "test" });
  });

  test("WHEN a note has been modified with new links THEN the new links are reflected in the Links table", async () => {
    // Now modify the note to change the wikilink from 'a' to 'b':
    await NoteTestUtilsV4.createNote({
      vault: testVault,
      wsRoot: testDir,
      fname: "wikilink-b",
      body: "[[b]]",
    });

    // Set the initial DB state:
    await parseAllNoteFilesForSqlite(
      ["a.md", "b.md", "wikilink-b.md"],
      testVault,
      db,
      testDir
    );

    // Now modify the note to change the wikilink from 'b' to 'a':
    await NoteTestUtilsV4.createNote({
      vault: testVault,
      wsRoot: testDir,
      fname: "wikilink-b",
      body: "[[a]]",
    });

    // and reinitialize:
    await parseAllNoteFilesForSqlite(
      ["a.md", "b.md", "wikilink-b.md"],
      testVault,
      db,
      testDir
    );

    await validateNotePropInDB(db, "a", testVault);
    await validateNotePropInDB(db, "b", testVault);
    await validateNotePropInDB(db, "wikilink-b", testVault);

    const result = await LinksTableUtils.getAllDLinks(db, "wikilink-b");

    if (result.isOk()) {
      expect(result.value.length).toEqual(1);

      const wikilink = result.value[0];
      expect(wikilink.type).toEqual("wiki");
      expect(wikilink.value).toEqual("a");
      expect(wikilink.from.id).toEqual("wikilink-b");
      expect(wikilink.to?.fname).toEqual("a");
      // TODO: Add check for wikilink.to.id
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(3);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Links)
    ).toEqual(1);
  });

  test("WHEN a note has been modified with links removed THEN the old links are missing from the Links table", async () => {
    // Now modify the note to remove the wikilink:
    await NoteTestUtilsV4.createNote({
      vault: testVault,
      wsRoot: testDir,
      fname: "wikilink-b",
      body: "[[b]]",
    });

    // Set the initial DB state:
    await parseAllNoteFilesForSqlite(
      ["a.md", "b.md", "wikilink-b.md"],
      testVault,
      db,
      testDir
    );

    // Now modify the note to remove the wikilink:
    await NoteTestUtilsV4.createNote({
      vault: testVault,
      wsRoot: testDir,
      fname: "wikilink-b",
      body: "no more links in this body",
    });

    // and reinitialize:
    await parseAllNoteFilesForSqlite(
      ["a.md", "b.md", "wikilink-b.md"],
      testVault,
      db,
      testDir
    );

    await validateNotePropInDB(db, "a", testVault);
    await validateNotePropInDB(db, "b", testVault);
    await validateNotePropInDB(db, "wikilink-b", testVault);

    const result = await LinksTableUtils.getAllDLinks(db, "wikilink-b");

    if (result.isOk()) {
      expect(result.value.length).toEqual(0);
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(3);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Links)
    ).toEqual(0);
  });

  test("WHEN many new notes are modified THEN the all the new note states are reflected in the DB", async () => {
    await parseAllNoteFilesForSqlite(["a.md", "b.md"], testVault, db, testDir);

    // Now modify the notes:
    await NoteTestUtilsV4.createNote({
      vault: testVault,
      wsRoot: testDir,
      fname: "a",
      custom: { test: "test" },
    });
    await NoteTestUtilsV4.createNote({
      vault: testVault,
      wsRoot: testDir,
      fname: "b",
      custom: { test: "test" },
    });

    // Initialize again:
    await parseAllNoteFilesForSqlite(["a.md", "b.md"], testVault, db, testDir);

    // The updated state should be in the DB:
    const result = await validateNotePropInDB(db, "a", testVault);
    expect(JSON.parse(result.value.custom)).toEqual({ test: "test" });

    const resultB = await validateNotePropInDB(db, "b", testVault);
    expect(JSON.parse(resultB.value.custom)).toEqual({ test: "test" });
  });

  // Deletion Tests
  test("WHEN a note has been deleted THEN all references to that note are deleted from the DB", async () => {
    // Set the initial DB state:
    await parseAllNoteFilesForSqlite(["a.md", "b.md"], testVault, db, testDir);

    // 'Delete' Note B
    await parseAllNoteFilesForSqlite(["a.md"], testVault, db, testDir);

    await validateNotePropInDB(db, "a", testVault);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(1);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.VaultNotes)
    ).toEqual(1);
  });

  test("WHEN a child note has been deleted THEN the parent-child row is deleted from the Hierarchy table", async () => {
    // Set the initial DB state:
    await parseAllNoteFilesForSqlite(
      ["a.md", "a.ch1.md"],
      testVault,
      db,
      testDir
    );

    // Now 'delete' the child note a.ch1.md
    await parseAllNoteFilesForSqlite(["a.md"], testVault, db, testDir);

    await validateNotePropInDB(db, "a", testVault);

    const result = await HierarchyTableUtils.getChildren(db, "a");

    expect(result.isOk()).toBeTruthy();
    if (result.isOk()) {
      expect(result.value.length).toEqual(0);
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(1);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Links)
    ).toEqual(0);
  });

  test("WHEN a parent note has been deleted THEN the parent-child row is deleted from the Hierarchy table", async () => {
    // Set the initial DB state:
    await parseAllNoteFilesForSqlite(
      ["a.md", "a.ch1.md"],
      testVault,
      db,
      testDir
    );

    // Now 'delete' the parent note a.md
    await parseAllNoteFilesForSqlite(["a.ch1.md"], testVault, db, testDir);

    await validateNotePropInDB(db, "a.ch1", testVault);

    const result = await HierarchyTableUtils.getParent(db, "a.ch1");

    expect(result.isOk()).toBeTruthy();
    if (result.isOk()) {
      expect(result.value).toEqual(null);
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(1);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Links)
    ).toEqual(0);
  });

  test("WHEN all notes have been deleted THEN initialization still succeeds and the database is empty apart from the Vaults Table", async () => {
    await parseAllNoteFilesForSqlite(["a.md", "b.md"], testVault, db, testDir);

    const response = await parseAllNoteFilesForSqlite(
      [],
      testVault,
      db,
      testDir
    );

    expect(response.isOk()).toBeTruthy();

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(0);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.VaultNotes)
    ).toEqual(0);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Hierarchy)
    ).toEqual(0);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Vaults)
    ).toEqual(1);
  });

  // Tests for more complicated scenarios:
  test("WHEN a combo of adds, updates, and deletes have happened THEN the DB state is updated correctly", async () => {
    // Set the initial DB state:
    await parseAllNoteFilesForSqlite(["a.md", "b.md"], testVault, db, testDir);

    // Now modify note A:
    await NoteTestUtilsV4.createNote({
      vault: testVault,
      wsRoot: testDir,
      fname: "a",
      custom: { test: "test" },
    });

    // 'Delete' Note B, Add Note C, modify Note A:
    await parseAllNoteFilesForSqlite(["a.md", "c.md"], testVault, db, testDir);

    // Validate 'A' is modified
    const result = await validateNotePropInDB(db, "a", testVault);
    expect(JSON.parse(result.value.custom)).toEqual({ test: "test" });

    // Validate B is missing
    const resultB = await NotePropsTableUtils.getById(db, "b");
    expect(resultB.isOk()).toBeTruthy();

    resultB.map((row) => {
      expect(row).toEqual(null);
    });

    // Validate C is present
    await validateNotePropInDB(db, "c", testVault);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(2);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.VaultNotes)
    ).toEqual(2);
  });

  // TODO Sqlite - modify this test such that it doesn't change contents of
  // 'a.md' (otherwise it'll interfere with other tests) and then re-enable the
  // test.
  test.skip("WHEN you change the ID of an existing note THEN Links, VaultNotes, and NoteProp tables are all updated correctly", async () => {
    // Set the initial DB state:
    await parseAllNoteFilesForSqlite(
      ["a.md", "a.ch1.md", "wikilink-a.md", "root.md"],
      testVault,
      db,
      testDir
    );

    // Now change A's ID:
    const newNoteId = "a-modified"; // TODO: Don't modify 'a' note - messes up subsequent tests
    const note = NoteUtils.create({
      vault: testVault,
      created: 1,
      updated: 1,
      fname: "a",
      id: newNoteId,
    });
    await note2File({ note, vault: testVault, wsRoot: testDir });

    // reinitialize the db
    await parseAllNoteFilesForSqlite(
      ["a.md", "a.ch1.md", "wikilink-a.md", "root.md"],
      testVault,
      db,
      testDir
    );

    // Validate 'A' is modified
    const result = await NotePropsTableUtils.getById(db, newNoteId);

    expect(result.isOk()).toBeTruthy();

    if (result.isOk()) {
      expect(result.value?.id).toEqual(newNoteId);
      expect(result.value?.fname).toEqual("a");
    }

    // Validate children of root is updated:
    const childrenResult = await HierarchyTableUtils.getChildren(db, "root");

    expect(childrenResult.isOk()).toBeTruthy();

    if (childrenResult.isOk()) {
      expect(childrenResult.value.length).toEqual(2);

      expect(childrenResult.value.includes(newNoteId)).toBeTruthy();
      expect(childrenResult.value.includes("a")).toBeFalsy();
    }

    // Validate parent of a.ch1 is updated:
    const parentAResult = await HierarchyTableUtils.getParent(db, newNoteId);
    expect(parentAResult.isOk()).toBeTruthy();
    if (parentAResult.isOk()) expect(parentAResult.value).toEqual("root");

    // Validate forward wikilink of wikilink-a is updated:
    const wikiLinkResult = await LinksTableUtils.getAllDLinks(db, "wikilink-a");
    expect(wikiLinkResult.isOk()).toBeTruthy();

    if (wikiLinkResult.isOk()) {
      expect(wikiLinkResult.value.length).toEqual(1);

      const wikilink = wikiLinkResult.value[0];
      expect(wikilink.type).toEqual("wiki");
      expect(wikilink.value).toEqual("a");
      expect(wikilink.from.id).toEqual("wikilink-a");
      expect(wikilink.to?.fname).toEqual("a");
      // TODO: Add check for wikilink.to.id
    }

    // Validate the VaultNotes table is properly updated:
    const resVaultNote = await VaultNotesTableUtils.getVaultFsPathForNoteId(
      db,
      newNoteId
    );

    expect(resVaultNote.isOk()).toBeTruthy();

    if (resVaultNote.isOk()) {
      expect(resVaultNote.value).toEqual(testVault.fsPath);
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(4);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.VaultNotes)
    ).toEqual(4);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.VaultNotes)
    ).toEqual(4);
  });

  // Multi-Vault Scenarios
  test("WHEN you have notes in two vaults with the same fname THEN Links, VaultNotes, and NoteProp tables are all correctly populated", async () => {
    // Set the initial DB state:
    const parseResult = await parseAllNoteFilesForSqlite(
      ["a.md", "a.ch1.md", "wikilink-a.md", "root.md"],
      testVault,
      db,
      testDir
    );
    expect(parseResult.isOk()).toBeTruthy();

    const parseResult2 = await parseAllNoteFilesForSqlite(
      ["a.md"],
      testVaultTwo,
      db,
      path.join(testDir, testVaultTwo.fsPath)
    );
    expect(parseResult2.isOk()).toBeTruthy();

    // Validate 'A' is modified
    const result = await NotePropsTableUtils.getById(db, "a");
    expect(result.isOk()).toBeTruthy();

    if (result.isOk()) {
      expect(result.value?.id).toEqual("a");
      expect(result.value?.fname).toEqual("a");
    }

    // Validate children of root is updated:
    const childrenResult = await HierarchyTableUtils.getChildren(db, "root");

    expect(childrenResult.isOk()).toBeTruthy();

    if (childrenResult.isOk()) {
      expect(childrenResult.value.length).toEqual(2);

      expect(childrenResult.value.includes("a")).toBeTruthy();
      expect(childrenResult.value.includes("a-vault-two")).toBeFalsy();
    }

    // Validate parent of a.ch1 points to the vault 1 note "a"
    const parentAResult = await HierarchyTableUtils.getParent(db, "a.ch1");
    expect(parentAResult.isOk()).toBeTruthy();
    if (parentAResult.isOk()) expect(parentAResult.value).toEqual("a");

    // Validate forward wikilink of wikilink-a is updated:
    const wikiLinkResult = await LinksTableUtils.getAllDLinks(db, "wikilink-a");
    expect(wikiLinkResult.isOk()).toBeTruthy();

    if (wikiLinkResult.isOk()) {
      expect(wikiLinkResult.value.length).toEqual(1);

      const wikilink = wikiLinkResult.value[0];
      expect(wikilink.type).toEqual("wiki");
      expect(wikilink.value).toEqual("a");
      expect(wikilink.from.id).toEqual("wikilink-a");
      expect(wikilink.to?.fname).toEqual("a");
    }

    // Validate the VaultNotes table is properly updated:
    const resVaultNote = await VaultNotesTableUtils.getVaultFsPathForNoteId(
      db,
      "a"
    );

    expect(resVaultNote.isOk()).toBeTruthy();

    if (resVaultNote.isOk()) {
      expect(resVaultNote.value).toEqual(testVault.fsPath);
    }

    // Now do the validation on vault 2 state:
    const vault2GetResult = await NotePropsTableUtils.getById(
      db,
      "a-vault-two"
    );

    expect(vault2GetResult.isOk()).toBeTruthy();

    if (vault2GetResult.isOk()) {
      expect(vault2GetResult.value?.id).toEqual("a-vault-two");
      expect(vault2GetResult.value?.fname).toEqual("a");
    }

    // Validate no parent for vault 2 note A
    const parentA2Result = await HierarchyTableUtils.getParent(
      db,
      "a-vault-two"
    );
    expect(parentA2Result.isOk()).toBeTruthy();
    if (parentA2Result.isOk()) expect(parentA2Result.value).toBeFalsy();

    // Validate no children for vault 2 note A
    // Validate children of root is updated:
    const childrenResult2 = await HierarchyTableUtils.getChildren(
      db,
      "a-vault-two"
    );

    expect(childrenResult2.isOk()).toBeTruthy();

    if (childrenResult2.isOk()) {
      expect(childrenResult2.value.length).toEqual(0);
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.NoteProps)
    ).toEqual(5);

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.VaultNotes)
    ).toEqual(5);
  });

  test("WHEN you have two vaults with cross-vault links AND the source vault is initialized first THEN the cross-vault links are properly resolved in the Links Table", async () => {
    // Initialize the vault that contains the note with the cross-vault link
    // first. We need to make sure that during init of 2nd vault, it goes back
    // and populates the sink id field of the row in the links table
    const parseResultVault2 = await parseAllNoteFilesForSqlite(
      ["cross-vault-link.md"],
      testVaultTwo,
      db,
      path.join(testDir, testVaultTwo.fsPath)
    );
    expect(parseResultVault2.isOk()).toBeTruthy();

    const parseResult = await parseAllNoteFilesForSqlite(
      ["b.md"],
      testVault,
      db,
      testDir
    );
    expect(parseResult.isOk()).toBeTruthy();

    // Validate forward wikilink of wikilink-a is updated:
    const wikiLinkResult = await LinksTableUtils.getAllDLinks(
      db,
      "cross-vault-link"
    );
    expect(wikiLinkResult.isOk()).toBeTruthy();

    let wikilinkPosition;

    if (wikiLinkResult.isOk()) {
      expect(wikiLinkResult.value.length).toEqual(1);

      const wikilink = wikiLinkResult.value[0];
      expect(wikilink.type).toEqual("wiki");
      expect(wikilink.value).toEqual("b");
      expect(wikilink.from.id).toEqual("cross-vault-link");
      expect(wikilink.to?.fname).toEqual("b");

      wikilinkPosition = wikilink.position;
    }

    // Validate backlink:
    const backlinkResult = await LinksTableUtils.getAllDLinks(db, "b");
    expect(backlinkResult.isOk()).toBeTruthy();

    if (backlinkResult.isOk()) {
      expect(backlinkResult.value.length).toEqual(1);

      const backlink = backlinkResult.value[0];
      expect(backlink.type).toEqual("backlink");
      expect(backlink.value).toEqual("b");
      expect(backlink.from.id).toEqual("cross-vault-link");
      expect(backlink.from.fname).toEqual("cross-vault-link");
      expect(backlink.from.vaultName).toEqual("testVaultTwo");
      expect(backlink.position).toEqual(wikilinkPosition);
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Links)
    ).toEqual(1);
  });

  test("WHEN you have two vaults with cross-vault links AND the sink vault is initialized first THEN the cross-vault links are properly resolved in the Links Table", async () => {
    const parseResult = await parseAllNoteFilesForSqlite(
      ["b.md"],
      testVault,
      db,
      testDir
    );
    expect(parseResult.isOk()).toBeTruthy();

    // Set the initial DB state:
    const parseResultVault2 = await parseAllNoteFilesForSqlite(
      ["cross-vault-link.md"],
      testVaultTwo,
      db,
      path.join(testDir, testVaultTwo.fsPath)
    );
    expect(parseResultVault2.isOk()).toBeTruthy();

    // Validate forward wikilink of wikilink-a is updated:
    const wikiLinkResult = await LinksTableUtils.getAllDLinks(
      db,
      "cross-vault-link"
    );
    expect(wikiLinkResult.isOk()).toBeTruthy();

    let wikilinkPosition;

    if (wikiLinkResult.isOk()) {
      expect(wikiLinkResult.value.length).toEqual(1);

      const wikilink = wikiLinkResult.value[0];
      expect(wikilink.type).toEqual("wiki");
      expect(wikilink.value).toEqual("b");
      expect(wikilink.from.id).toEqual("cross-vault-link");
      expect(wikilink.to?.fname).toEqual("b");

      wikilinkPosition = wikilink.position;
    }

    // Validate backlink:
    const backlinkResult = await LinksTableUtils.getAllDLinks(db, "b");
    expect(backlinkResult.isOk()).toBeTruthy();

    if (backlinkResult.isOk()) {
      expect(backlinkResult.value.length).toEqual(1);

      const backlink = backlinkResult.value[0];
      expect(backlink.type).toEqual("backlink");
      expect(backlink.value).toEqual("b");
      expect(backlink.from.id).toEqual("cross-vault-link");
      expect(backlink.from.fname).toEqual("cross-vault-link");
      expect(backlink.from.vaultName).toEqual("testVaultTwo");
      expect(backlink.position).toEqual(wikilinkPosition);
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Links)
    ).toEqual(1);
  });

  test("WHEN you have a cross vault wikilink with fully qualified vault syntax THEN the cross-vault link sink points to the note in the correct vault in the Links Table", async () => {
    // Initialize the vault that contains the note with the cross-vault link
    // first. We need to make sure that during init of 2nd vault, it goes back
    // and populates the sink id field of the row in the links table
    const parseResultVault2 = await parseAllNoteFilesForSqlite(
      ["cross-vault-link-with-vault-qualifier.md"],
      testVaultTwo,
      db,
      path.join(testDir, testVaultTwo.fsPath)
    );
    expect(parseResultVault2.isOk()).toBeTruthy();

    // Setup Vault 1 First
    const parseResultVault1 = await parseAllNoteFilesForSqlite(
      ["a.md"],
      testVault,
      db,
      testDir
    );
    expect(parseResultVault1.isOk()).toBeTruthy();

    // Now finally setup vault 3 - the correct sink note is here.
    const parseResultVault3 = await parseAllNoteFilesForSqlite(
      ["a.md"],
      testVaultThree,
      db,
      path.join(testDir, testVaultThree.fsPath)
    );
    expect(parseResultVault3.isOk()).toBeTruthy();

    // Validate forward wikilink of wikilink-a is updated:
    const wikiLinkResult = await LinksTableUtils.getAllDLinks(
      db,
      "cross-vault-link-with-vault-qualifier"
    );
    expect(wikiLinkResult.isOk()).toBeTruthy();

    let wikilinkPosition;

    if (wikiLinkResult.isOk()) {
      expect(wikiLinkResult.value.length).toEqual(1);

      const wikilink = wikiLinkResult.value[0];
      expect(wikilink.type).toEqual("wiki");
      expect(wikilink.value).toEqual("a");
      expect(wikilink.from.id).toEqual("cross-vault-link-with-vault-qualifier");
      expect(wikilink.to?.fname).toEqual("a");
      expect(wikilink.to?.vaultName).toEqual("testVaultThree");
      expect(wikilink.xvault).toBeTruthy();

      wikilinkPosition = wikilink.position;
    }

    // Validate backlink for vault 3 note a:
    const backlinkResult = await LinksTableUtils.getAllDLinks(
      db,
      "a-vault-three"
    );
    expect(backlinkResult.isOk()).toBeTruthy();

    if (backlinkResult.isOk()) {
      expect(backlinkResult.value.length).toEqual(1);

      const backlink = backlinkResult.value[0];
      expect(backlink.type).toEqual("backlink");
      expect(backlink.value).toEqual("a");
      expect(backlink.from.id).toEqual("cross-vault-link-with-vault-qualifier");
      expect(backlink.from.fname).toEqual(
        "cross-vault-link-with-vault-qualifier"
      );
      expect(backlink.from.vaultName).toEqual("testVaultTwo");
      expect(backlink.position).toEqual(wikilinkPosition);
    }

    // Validate no backlink exists for vault 1 note a:
    const backlinkResultVault1 = await LinksTableUtils.getAllDLinks(db, "a");
    expect(backlinkResultVault1.isOk()).toBeTruthy();

    if (backlinkResultVault1.isOk()) {
      expect(backlinkResultVault1.value.length).toEqual(0);
    }

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Links)
    ).toEqual(1);
  });

  test("WHEN you have an ambiguous cross vault wikilink that can resolve to multiple vaults THEN a link exists to each potential sink", async () => {
    const parseResultVault2 = await parseAllNoteFilesForSqlite(
      ["cross-vault-link-ambiguous.md", "a.md"],
      testVaultTwo,
      db,
      path.join(testDir, testVaultTwo.fsPath)
    );

    expect(parseResultVault2.isOk()).toBeTruthy();

    const parseResult = await parseAllNoteFilesForSqlite(
      ["a.md"],
      testVault,
      db,
      testDir
    );
    expect(parseResult.isOk()).toBeTruthy();

    const parseResultVault3 = await parseAllNoteFilesForSqlite(
      ["a.md"],
      testVaultThree,
      db,
      path.join(testDir, testVaultThree.fsPath)
    );

    expect(parseResultVault3.isOk()).toBeTruthy();
    // Validate forward wikilink of wikilink-a is updated:
    const wikiLinkResult = await LinksTableUtils.getAllDLinks(
      db,
      "cross-vault-link-ambiguous"
    );
    expect(wikiLinkResult.isOk()).toBeTruthy();
    let wikilinkPosition: Position | undefined;

    if (wikiLinkResult.isOk()) {
      expect(wikiLinkResult.value.length).toEqual(1);

      const wikilink = wikiLinkResult.value[0];
      expect(wikilink.type).toEqual("wiki");
      expect(wikilink.value).toEqual("a");
      expect(wikilink.from.id).toEqual("cross-vault-link-ambiguous");
      expect(wikilink.to?.fname).toEqual("a");
      expect(wikilink.to?.vaultName).toBeFalsy();

      wikilinkPosition = wikilink.position;
    }

    // Validate backlinks. A backlink should exist for all 3 notes with fname "a":
    await Promise.all(
      ["a", "a-vault-two", "a-vault-three"].map(async (noteId) => {
        const backlinkResult = await LinksTableUtils.getAllDLinks(db, noteId);
        expect(backlinkResult.isOk()).toBeTruthy();

        if (backlinkResult.isOk()) {
          expect(backlinkResult.value.length).toEqual(1);

          const backlink = backlinkResult.value[0];
          expect(backlink.type).toEqual("backlink");
          expect(backlink.value).toEqual("a");
          expect(backlink.from.id).toEqual("cross-vault-link-ambiguous");
          expect(backlink.from.fname).toEqual("cross-vault-link-ambiguous");
          expect(backlink.from.vaultName).toEqual("testVaultTwo");
          expect(backlink.position).toEqual(wikilinkPosition);
        }
      })
    );

    expect(
      await SqliteTestUtils.getRowCountForTable(db, SqliteTableNames.Links)
    ).toEqual(3);
  });

  // WHEN you have two vaults with cross-vault link candidates, THEN the cross-vault links candidates are properly resolved in the Links Table
});

// Helper validation functions
async function validateNotePropInDB(
  db: Database,
  noteId: string,
  vault: DVault
): Promise<Ok<NotePropsTableRow, any>> {
  const result = await NotePropsTableUtils.getById(db, noteId);

  expect(result.isOk()).toBeTruthy();
  if (result.isOk()) {
    expect(result.value?.id).toEqual(noteId);
    expect(result.value?.fname).toEqual(noteId);
  }

  const resVaultNote = await VaultNotesTableUtils.getVaultFsPathForNoteId(
    db,
    noteId
  );

  expect(resVaultNote.isOk()).toBeTruthy();

  if (resVaultNote.isOk()) {
    expect(resVaultNote.value).toEqual(vault.fsPath);
  }

  // Return the result in case more validation needs to be done:
  return result as unknown as Ok<NotePropsTableRow, any>;
}
