import LRU from "lru-cache";
import { Cache } from "./cache";
import { DendronError } from "../../error";

export type LruCacheOpts = {
  /** Max number of items to keep in cache. */
  maxItems: number;
};

/**
 *  Least recently used cache implementation. Deletes the least-recently-used
 *  items, when cache max items is reached.
 *  (get methods count toward recently used order) */
export class LruCache<K, T> implements Cache<K, T> {
  private cache: LRU<K, T>;

  constructor(opts: LruCacheOpts) {
    if (opts.maxItems <= 0) {
      throw new DendronError({
        message: `Max items cannot be less than or equal to 0`,
      });
    }

    this.cache = new LRU<K, T>({
      max: opts.maxItems,
    });
  }

  get(key: K): T | undefined {
    return this.cache.get(key);
  }

  set(key: K, data: T): void {
    this.cache.set(key, data);
  }
}
