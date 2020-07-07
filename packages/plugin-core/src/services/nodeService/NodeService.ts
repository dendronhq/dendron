import { IDNode } from "@dendronhq/common-all";
import { DEngine, QueryMode } from "@dendronhq/common-all";
import { DendronEngine } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";

export class NodeService {
    public engine: DEngine;

    constructor() {
        this.engine = DendronEngine.getOrCreateEngine();
        if (!this.engine.initialized) {
            throw Error("engine not intiialized");
        }
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