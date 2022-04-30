import {
  BacklinksCache,
  BacklinksCacheEntry,
  BacklinksCacheEntryMap,
} from "@dendronhq/common-all";
import _ from "lodash";
import { DendronFileSystemCache } from "./dendronFileSystemCache";

export class BacklinksFileSystemCache extends DendronFileSystemCache<
  BacklinksCache,
  BacklinksCacheEntry
> {
  get(key: string): BacklinksCacheEntry | undefined {
    return this._cacheContents.backlinks[key]
      ? JSON.parse(JSON.stringify(this._cacheContents.backlinks[key]))
      : undefined;
  }

  set(key: string, value: BacklinksCacheEntry): void {
    this._cacheContents.backlinks[key] = value;
  }

  drop(key: string): void {
    delete this._cacheContents.backlinks[key];
  }

  getBacklinksCacheData(): BacklinksCacheEntryMap {
    return this._cacheContents.backlinks
      ? JSON.parse(JSON.stringify(this._cacheContents.backlinks))
      : {};
  }

  createEmptyCacheContents(): BacklinksCache {
    return { version: 0, backlinks: {} };
  }
}
