import { VaultsTableRow, VaultsTableUtils } from "@dendronhq/engine-server";
import { Database } from "sqlite3";

describe("GIVEN a Vaults Sqlite Table", () => {
  let db: Database;
  beforeEach(() => {
    db = new Database(":memory:");
  });
  afterEach(() => {
    db.close();
  });

  const testVault: Omit<VaultsTableRow, "id"> = {
    name: "name",
    fsPath: "fsPath",
  };

  test("WHEN a Vaults row is inserted THEN it can be retrieved", async () => {
    const tableRes = await VaultsTableUtils.createTable(db);
    expect(tableRes.isErr()).toBeFalsy();

    const insertResult = await VaultsTableUtils.insert(db, testVault);
    expect(insertResult.isErr()).toBeFalsy();

    const dbResult = await VaultsTableUtils.getIdByFsPath(db, "fsPath");

    dbResult
      .mapErr((e) => {
        fail(e);
      })
      .map((id) => {
        expect(id).toEqual(1);
        // expect(vault.name).toEqual("name");
        // expect(vault.fsPath).toEqual("fsPath");
      });
  });

  test("WHEN a duplicate fsPath row is inserted THEN a duplicate row is not created", async () => {
    const tableRes = await VaultsTableUtils.createTable(db);
    expect(tableRes.isErr()).toBeFalsy();

    const insertResult = await VaultsTableUtils.insert(db, testVault);
    expect(insertResult.isErr()).toBeFalsy();

    const insertResultTwo = await VaultsTableUtils.insert(db, testVault);
    expect(insertResultTwo.isErr()).toBeTruthy();
  });
});
