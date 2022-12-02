import { ResultAsync } from "@dendronhq/common-all";
import {
  SqliteError,
  SqliteErrorType,
  SqliteQueryUtils,
} from "@dendronhq/engine-server";
import { Database } from "sqlite3";

/**
 * Helper test function to test that invalid syntax queries properly return
 * errors.
 * @param db
 * @param queryUtilsFn
 */
async function invalidSyntaxTest(
  db: Database,
  queryUtilsFn: (db: Database, sql: string) => ResultAsync<any, SqliteError>
) {
  const sql = "THIS IS AN INVALID QUERY";
  const result = await queryUtilsFn(db, sql);

  expect(result.isErr()).toBeTruthy();

  result.mapErr((err) => {
    expect(err.type).toEqual(SqliteErrorType.InvalidQuerySyntax);
    expect(err.query).toEqual(sql);
  });
}

describe("GIVEN a SqliteQueryUtils class", () => {
  let db: Database;
  beforeEach(() => {
    db = new Database(":memory:");
  });
  afterEach(() => {
    db.close();
  });

  test("WHEN a query is RUN with invalid syntax THEN the appropriate error is returned", async () => {
    await invalidSyntaxTest(db, (db, sql) => {
      return SqliteQueryUtils.run(db, sql);
    });
  });

  test("WHEN a query is GET with invalid syntax THEN the appropriate error is returned", async () => {
    await invalidSyntaxTest(db, (db, sql) => {
      return SqliteQueryUtils.get(db, sql);
    });
  });

  test("WHEN a query is ALL with invalid syntax THEN the appropriate error is returned", async () => {
    await invalidSyntaxTest(db, (db, sql) => {
      return SqliteQueryUtils.all(db, sql);
    });
  });
});
