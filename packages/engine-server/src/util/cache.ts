/** Cache interface. */
export interface Cache<K, T> {
  /** returns data object if a the given key is found; undefined otherwise. */
  get(key: K): T | undefined;

  /** Set the given data, potentially removing a different item depending
   *  on cache implementation and cache state. */
  set(key: K, data: T): void;
}

/** Null object implementation of {@link Cache} to be used when we
 *  dont want the code to actually use the cache. */
export class NullCache<K, T> implements Cache<K, T> {
  // @ts-ignore
  get(key: K): T | undefined {
    return undefined;
  }

  // @ts-ignore
  set(key: K, data: T): void {
    // Empty since this is null object implementation
  }
}
