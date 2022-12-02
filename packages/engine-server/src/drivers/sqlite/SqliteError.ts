// TODO Sqlite - just a stub right now. Enhance to provide info like error type
// (invalid syntax, foreign key constraint failed, unique key constraint failed,
// etc.), and also what SQL query was run that produced the error.
export interface SqliteError extends Error {
  type: SqliteErrorType;

  /**
   * The raw SQL query. This may be truncated if the query string is too long.
   */
  query: string;
}

export enum SqliteErrorType {
  InvalidQuerySyntax = "InvalidQuerySyntax",
  ForeignKeyConstraintViolation = "ForeignKeyConstraintViolation",
  /**
   * Query returned empty when it was expected to return at least 1 result.
   */
  NoResults = "NoResults",
  Unknown = "Unknown", // When hitting an unknown error, add a new enum value for it.
}
