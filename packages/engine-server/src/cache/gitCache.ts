import { DNodeTypeV2, NotePropsV2 } from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { Git } from "../topics/git";

type Checkpoint = any;
type DEngineCache = any;

type GitCacheOpts = {
  root: string;
};

function getCacheFile(type: DNodeTypeV2, checkpoint: Checkpoint) {
  return `.dendron.cache.${type}.${checkpoint}.json`;
}

export class GitCache implements DEngineCache {
  public git: Git;
  public entries: { [key: string]: NotePropsV2 };

  constructor(public opts: GitCacheOpts) {
    this.git = new Git({ localUrl: opts.root });
    this.entries = {};
  }

  async get(key: string): Promise<NotePropsV2 | null> {
    return _.get(this.entries, key, null);
  }

  async getAll(type: DNodeTypeV2, checkpoint: any): Promise<NotePropsV2[]> {
    const fpath = this.opts.root;
    if (!fs.existsSync(fpath)) {
      return [];
    }
    const basename = getCacheFile(type, checkpoint);
    let notes = fs.readJSONSync(path.join(fpath, basename));
    return notes;
  }

  async setAll(
    type: DNodeTypeV2,
    entries: NotePropsV2[],
    checkpoint: any
  ): Promise<void> {
    const fpath = this.opts.root;
    const basename = getCacheFile(type, checkpoint);
    return fs.writeJSONSync(path.join(fpath, basename), entries);
  }
}
