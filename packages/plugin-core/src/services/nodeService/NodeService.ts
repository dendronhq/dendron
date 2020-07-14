import { IDNode } from "@dendronhq/common-all";
import { DEngine, QueryMode } from "@dendronhq/common-all";
import { DendronEngine } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";

let _NODE_SERVICE: undefined | NodeService = undefined;

export class NodeService {
  public engine: DEngine;

  static instance() {
    if (_.isUndefined(_NODE_SERVICE)) {
      throw Error("node service not instnatiated");
    }
    return _NODE_SERVICE;
  }

  constructor() {
    this.engine = DendronEngine.getOrCreateEngine();
    if (!this.engine.initialized) {
      throw Error("engine not intiialized");
    }
    _NODE_SERVICE = this;
  }

  async deleteByPath(fpath: string, mode: QueryMode): Promise<IDNode> {
    if (mode === "schema") {
      throw Error("delete by schema not supported");
    } else {
      const fpathClean = path.basename(fpath, ".md");
      const node = _.find(this.engine["notes"], { fname: fpathClean });
      if (!node) {
        throw Error(`no node found for ${fpath}`);
      }
      await this.engine.delete(node.id);
      return node;
    }
  }
}
