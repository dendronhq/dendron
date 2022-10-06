import { ResultAsync } from "neverthrow";
import {
  DendronError,
  NoteChangeEntry,
  NotePropsByIdDict,
  NotePropsMeta,
  SchemaModuleDict,
  SchemaModuleProps,
} from "..";

export type INoteQueryOpts = {
  /**
   * Original query string (which can contain minor modifications such as mapping '/'->'.')
   * This string is added for sorting the lookup results when there is exact match with
   * original query. */
  originalQS: string;
  onlyDirectChildren?: boolean;
};

export interface IQueryStore {
  queryNotes(
    qs: string,
    opts: INoteQueryOpts
  ): ResultAsync<NotePropsMeta[], DendronError>;
  querySchemas(
    qs: string,
    opts?: INoteQueryOpts
  ): ResultAsync<any, DendronError>;
  updateNotesIndex(changes: NoteChangeEntry[]): ResultAsync<void, DendronError>;
  updateSchemasIndex(): ResultAsync<void, DendronError>;
  replaceNotesIndex(props: NotePropsByIdDict): ResultAsync<void, DendronError>;
  replaceSchemasIndex(props: SchemaModuleDict): ResultAsync<void, DendronError>;

  removeSchemaFromIndex(
    schema: SchemaModuleProps
  ): ResultAsync<void, DendronError>;

  addSchemaToIndex(schema: SchemaModuleProps): ResultAsync<void, DendronError>;
}
