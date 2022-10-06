import { ResultAsync } from "neverthrow";
import { DendronError, NotePropsMeta } from "..";

export interface IDataQueryable<K, V> {
  query(key: K): ResultAsync<V, DendronError>;
}

export type INoteQueryable = IDataQueryable<string, NotePropsMeta[]>;
