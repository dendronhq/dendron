import {
  Checkpoint,
  DEngineCache,
  DNodeRawProps,
  IDNodeType,
} from "@dendronhq/common-all";
import _ from "lodash";
import { Git } from "../topics/git";
import fs from "fs-extra";
import path from "path";

type GitCacheOpts = {
  root: string;
};

function getCacheFile(type: IDNodeType, checkpoint: Checkpoint) {
  return `.dendron.cache.${type}.${checkpoint}.json`;
}

export class GitCache implements DEngineCache {
  public git: Git;
  public entries: { [key: string]: DNodeRawProps };

  constructor(public opts: GitCacheOpts) {
    this.git = new Git({ localUrl: opts.root });
    this.entries = {};
  }

  async get(key: string): Promise<DNodeRawProps | null> {
    return _.get(this.entries, key, null);
  }

  async getAll(type: IDNodeType, checkpoint: any): Promise<DNodeRawProps[]> {
    const fpath = this.opts.root;
    if (!fs.existsSync(fpath)) {
      return [];
    }
    const basename = getCacheFile(type, checkpoint);
    let notes = fs.readJSONSync(path.join(fpath, basename));
    return notes;
  }

  async setAll(
    type: IDNodeType,
    entries: DNodeRawProps[],
    checkpoint: any
  ): Promise<void> {
    const fpath = this.opts.root;
    const basename = getCacheFile(type, checkpoint);
    return fs.writeJSONSync(path.join(fpath, basename), entries);
  }
}
