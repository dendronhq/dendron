import { Cache, FileSystemCache } from "@dendronhq/common-all";
import { DLogger } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";

export abstract class DendronFileSystemCache<T extends FileSystemCache, V>
  implements Cache<string, V>
{
  protected _cacheContents: T;
  private _cachePath: string;
  private _noCaching: boolean | undefined;
  private _logger: DLogger;
  private _numCacheMisses: number;

  constructor({
    cachePath,
    noCaching,
    logger,
  }: {
    cachePath: string;
    logger: DLogger;
    noCaching?: boolean;
  }) {
    this._cachePath = cachePath;
    this._noCaching = noCaching;
    this._logger = logger;
    this._numCacheMisses = 0;
    if (this._noCaching) {
      this._cacheContents = this.createEmptyCacheContents();
    } else {
      this._cacheContents = this.readFromFileSystem();
    }
  }

  get numCacheMisses() {
    return this._numCacheMisses;
  }

  /**
   * Read contents from filesystem including version and cache entries
   * @returns cache contents
   */
  private readFromFileSystem(): T {
    const ctx = "DendronFileSystemCache:readFromFileSystem";
    if (fs.existsSync(this._cachePath)) {
      try {
        return fs.readJSONSync(this._cachePath) as T;
      } catch (_err: any) {
        this._logger.error({ ctx, _err });
        return this.createEmptyCacheContents();
      }
    } else {
      return this.createEmptyCacheContents();
    }
  }

  abstract get(key: string): V | undefined;
  abstract set(key: string, data: V): void;
  abstract drop(key: string): void;

  abstract createEmptyCacheContents(): T;

  /**
   * Write contents of cache to file system
   */
  writeToFileSystem(): void {
    if (!this._noCaching) {
      return fs.writeJSONSync(this._cachePath, this._cacheContents);
    }
    return;
  }

  /**
   * Delete cache file if it exists
   */
  removeFromFileSystem(): void {
    this.createEmptyCacheContents();
    if (fs.pathExistsSync(this._cachePath)) {
      return fs.removeSync(this._cachePath);
    }
    return;
  }

  incrementCacheMiss(): void {
    this._numCacheMisses += 1;
  }
}
