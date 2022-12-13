import { DLogger, ResultAsync } from "@dendronhq/common-all";
import { getDurationMilliseconds } from "@dendronhq/common-server";
import { Database } from "sqlite3";
import { SqliteError, SqliteErrorType } from "./SqliteError";

/**
 * Static Utils that help run sqlite database queries. Instead of taking
 * callbacks like the sqlite3 library, these methods will return an awaitable
 * ResultAsync and package Sqlite query errors into a SqliteError object.
 */
export class SqliteQueryUtils {
  public static run(
    db: Database,
    sql: string,
    logger?: DLogger
  ): ResultAsync<null, SqliteError> {
    const start = process.hrtime();

    const prom = new Promise<null>((resolve, reject) => {
      db.run(sql, (err) => {
        if (err) {
          logger?.error(
            `SqliteQueryUtils.run() failed with error message ${
              err.message
            } in ${getDurationMilliseconds(
              start
            )} ms. Query String: ${SqliteQueryUtils.formatQueryString(sql)}`
          );

          reject(err.message);
        } else {
          logger?.info(
            `Executed SqliteQueryUtils.run() in ${getDurationMilliseconds(
              start
            )} ms. Query String: ${SqliteQueryUtils.formatQueryString(sql)}`
          );

          resolve(null);
        }
      });
    });

    return ResultAsync.fromPromise(prom, (e) => {
      return this.getSqliteError(e as string, sql);
    });
  }

  /**
   * Runs Database.get() method of sqlite3 and packages the result (first row)
   * in an awaitable ResultAsync
   * @param db
   * @param sql
   * @param logger
   * @returns
   */
  public static get<T = any>(
    db: Database,
    sql: string,
    logger?: DLogger
  ): ResultAsync<T, SqliteError> {
    const start = process.hrtime();

    const prom = new Promise<T>((resolve, reject) => {
      db.get(sql, (err, row) => {
        if (err) {
          logger?.error(
            `SqliteQueryUtils.get() failed with error message ${
              err.message
            } in ${getDurationMilliseconds(
              start
            )} ms. Query String: ${SqliteQueryUtils.formatQueryString(sql)}`
          );

          reject(err.message);
        } else {
          logger?.info(
            `Executed SqliteQueryUtils.get() query in ${getDurationMilliseconds(
              start
            )} ms. Query String: ${SqliteQueryUtils.formatQueryString(sql)}`
          );

          resolve(row);
        }
      });
    });

    return ResultAsync.fromPromise(prom, (e) => {
      return this.getSqliteError(e as string, sql);
    });
  }

  /**
   * Runs Database.all() method of sqlite3 and packages the result (array of
   * rows) in an awaitable ResultAsync
   * @param db
   * @param sql
   * @param logger
   * @returns
   */
  public static all<T = any>(
    db: Database,
    sql: string,
    logger?: DLogger
  ): ResultAsync<T[], SqliteError> {
    const start = process.hrtime();

    const prom = new Promise<any>((resolve, reject) => {
      db.all(sql, (err, rows) => {
        if (err) {
          logger?.error(
            `SqliteQueryUtils.all() failed with error message ${
              err.message
            } in ${getDurationMilliseconds(
              start
            )} ms. Query String: ${sql.slice(0, 1000)}`
          );

          reject(err.message);
        } else {
          logger?.info(
            `Executed SqliteQueryUtils.all() query in ${getDurationMilliseconds(
              start
            )} ms. Query String: ${SqliteQueryUtils.formatQueryString(sql)}`
          );

          resolve(rows);
        }
      });
    });

    return ResultAsync.fromPromise(prom, (e) => {
      return this.getSqliteError(e as string, sql);
    });
  }

  private static getSqliteError(
    errorString: string,
    sqlQuery: string
  ): SqliteError {
    let type: SqliteErrorType = SqliteErrorType.Unknown;

    if (errorString === "SQLITE_CONSTRAINT: FOREIGN KEY constraint failed") {
      type = SqliteErrorType.ForeignKeyConstraintViolation;
    } else if (errorString.includes("syntax error")) {
      type = SqliteErrorType.InvalidQuerySyntax;
    }

    return {
      type,
      query: sqlQuery,
      message: errorString,
      name: type,
    };
  }

  private static formatQueryString(sql: string): string {
    const CHAR_LIMIT = 1000;

    if (sql.length <= CHAR_LIMIT) {
      return sql;
    }

    return [sql.slice(0, 500), sql.slice(-500)].join("...");
  }
}
