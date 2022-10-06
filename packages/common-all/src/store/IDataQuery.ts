import { ResultAsync } from "neverthrow";
import { DendronError, NoteChangeEntry, NotePropsMeta } from "..";

export type INoteQueryOpts = {
  /**
   * Original query string (which can contain minor modifications such as mapping '/'->'.')
   * This string is added for sorting the lookup results when there is exact match with
   * original query. */
  originalQS: string;
  onlyDirectChildren?: boolean;
};

export interface IDataQueryable<K, V> {
  query(key: K, opts: INoteQueryOpts): ResultAsync<V, DendronError>;
}

export type INoteQueryable = IDataQueryable<string, NotePropsMeta[]> & {
  updateIndex(changes: NoteChangeEntry[]): ResultAsync<void, DendronError>;
};
