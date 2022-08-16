import { SchemaModuleProps, RespV3, WriteSchemaOpts } from "../types";

/**
 * Interface responsible for interacting with SchemaModuleProps storage layer
 */
export interface ISchemaStore<K> {
  /**
   * Get SchemaModuleProps metadata by key.
   * Unlike {@link ISchemaStore.get}, this retrieves SchemaModuleProps from the metadata store.
   * If key is not found, return error.
   *
   * @param key: key of SchemaModuleProps
   * @return SchemaModuleProps metadata
   */
  getMetadata(key: K): Promise<RespV3<SchemaModuleProps>>;

  /**
   * Bulk get SchemaModuleProps by list of key
   * If no schemas are found, return empty list.
   *
   * @param key: keys of SchemaModuleProps
   * @return list of SchemaModuleProps
   */
  bulkGetMetadata(keys: K[]): Promise<RespV3<SchemaModuleProps>[]>;

  /**
   * Write SchemaModuleProps to storage layer for given key, overriding existing SchemaModuleProps if it already exists
   *
   * @param opts: SchemaModuleProps write criteria
   * @return original key
   */
  write(opts: WriteSchemaOpts<K>): Promise<RespV3<K>>;

  /**
   * Write SchemaModuleProps metadata to storage layer for given key, overriding existing SchemaModuleProps metadata if it already exists
   * Unlike {@link ISchemaStore.write}, this will not touch the filesystem
   *
   * @param opts: SchemaModuleProps write criteria
   * @return original key
   */
  writeMetadata(opts: WriteSchemaOpts<K>): Promise<RespV3<K>>;

  /**
   * Bulk write SchemaModuleProps metadata to storage layer for given key, overriding existing SchemaModuleProps metadata if it already exists
   *
   * @param opts: SchemaModuleProps write criteria array
   * @return original key array
   */
  bulkWriteMetadata(opts: WriteSchemaOpts<K>[]): Promise<RespV3<K>[]>;

  /**
   * Delete SchemaModuleProps from storage layer for given key.
   * If key does not exist, do nothing.
   *
   * @param key: key of SchemaModuleProps to delete
   * @return original key
   */
  delete(key: K): Promise<RespV3<string>>;

  /**
   * Delete SchemaModuleProps metadata from storage layer for given key.
   * If key does not exist, do nothing.
   * Unlike {@link ISchemaStore.delete}, this will not touch the filesystem
   *
   * @param key: key of SchemaModuleProps to delete
   * @return original key
   */
  deleteMetadata(key: K): Promise<RespV3<string>>;
}
