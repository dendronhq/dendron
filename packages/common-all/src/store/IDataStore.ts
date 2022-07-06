import { RespV3 } from "../types";

/**
 * Interface responsible for interacting with data store
 */

export interface IDataStore<K, V> {
  /**
   * Get data by key
   * If key is not found, return error.
   *
   * @param key: key of data
   * @return data
   */
  get(key: K): Promise<RespV3<V>>;

  /**
   * Find data by criteria. If no criteria is set, return empty array.
   * If multiple criterias are set, find data that matches all criteria
   *
   * @param opts: data criteria
   * @return List of data that matches criteria
   */
  find(opts: any): Promise<RespV3<V[]>>;

  /**
   * Write data to store for given key, overriding existing data if it already exists
   *
   * @param key: key of data to write
   * @param data: data to write
   * @return original key
   */
  write(key: K, data: V): Promise<RespV3<K>>;

  /**
   * Delete data from store for given key.
   * If key does not exist, do nothing.
   *
   * @param key: key of data to delete
   * @return original key
   */
  delete(key: K): Promise<RespV3<string>>;
}
