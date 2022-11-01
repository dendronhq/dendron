import { ResultAsync } from "neverthrow";
import { Database } from "sqlite3";
import { SqliteError } from "../SqliteError";

export function getIntegerString(value: number | undefined | null): string {
  if (value) {
    return `${value.toString()}`;
  }
  return "null";
}

export function getJSONString(value: any): string {
  if (value) {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  return "null";
}

export function getSQLValueString(value: string | null | undefined): string {
  if (value) {
    return `'${value.replace(/'/g, "''")}'`; // Single quotes need to be escaped in SQLite
  }
  return "null";
}

export function getSQLBoolean(value: boolean | undefined): string {
  return value ? "1" : "0";
}

export function executeSqlWithVoidResult(
  db: Database,
  sql: string
): ResultAsync<void, SqliteError> {
  const prom = new Promise<void>((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) {
        reject(err.message);
      } else {
        resolve();
      }
    });
  });

  return ResultAsync.fromPromise(prom, (e) => {
    return e as SqliteError;
  });
}

export async function enableForeignKeys(db: Database) {
  await new Promise<void>((resolve) => {
    db.run("PRAGMA foreign_keys = ON", (err) => {
      if (!err) {
        resolve();
      }
    });
  });
}
