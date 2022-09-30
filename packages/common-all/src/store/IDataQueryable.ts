import { ResultAsync } from "neverthrow";
import { DendronError } from "..";

export interface IDataQueryable<K, V> {
  query(key: K): ResultAsync<V, DendronError>;
}
