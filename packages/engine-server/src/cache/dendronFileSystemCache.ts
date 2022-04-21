import { Cache, FileSystemCache } from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";

export abstract class DendronFileSystemCache<T extends FileSystemCache, V>
  implements Cache<string, V>
{
  protected _cacheContents: T;
  private _cachePath: string;

  constructor({
    cachePath,
    noCaching,
  }: {
    cachePath: string;
    noCaching?: boolean;
  }) {
    this._cachePath = cachePath;
    if (noCaching) {
      this._cacheContents = this.createEmptyCacheContents();
    } else {
      this._cacheContents = this.readFromFileSystem();
    }
  }

  /**
   * Read contents from filesystem including version and cache entries
   * @returns cache contents
   */
  private readFromFileSystem(): T {
    if (fs.existsSync(this._cachePath)) {
      return fs.readJSONSync(this._cachePath) as T;
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
    return fs.writeJSONSync(this._cachePath, this._cacheContents);
  }

  /**
   * Delete cache file if it exists
   */
  removeFromFileSystem(): void {
    if (fs.pathExistsSync(this._cachePath)) {
      return fs.removeSync(this._cachePath);
    }
    return;
  }
}
