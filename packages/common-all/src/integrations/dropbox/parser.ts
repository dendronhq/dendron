import { ListFolderResultSimple, MetadataReference } from "./types";
import { dxId2DendronId, fileNameToTreePath } from "./utils";

import { IDNode } from "../../types";
import { Note } from "../../node";
import _ from "lodash";

interface PathEnt<T> {
  path: string[];
  data: T;
  size: number
}

type PathDict<T> = { [key: string]: PathEnt<T> };

class DropboxTreeParser {
  public seed: ListFolderResultSimple;
  public pathDict: PathDict<MetadataReference>;

  constructor(seed: ListFolderResultSimple) {
    this.seed = seed;
    this.pathDict = {};
    this.seedToPathDict();
  }

  seedToPathDict() {
    this.seed.entries.forEach(ent => {
      const { name } = ent;
      const treePath = fileNameToTreePath(name);
      const size = treePath.length
      this.pathDict[treePath.join(".")] = { path: treePath, data: ent, size };
    });
  }

  execute(): Note[] {
    const currentLvl = _.pickBy(this.pathDict, {size: 1})

    prefixes where {size: 1}
    
    const nodes = this.getTopLevelNodes();
    nodes.forEach(n => {
      this.parse(n);
    });
    return nodes;
  }

  parse(node: Note) {}
}
