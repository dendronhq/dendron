import { DEngine, DEngineStore, DNodeDict, IDNode, NodeGetResp, NodeQueryResp, QueryOpts, Scope } from "../common/types";
import Fuse from "fuse.js";
export interface FuseOptions {
    exactMatch?: boolean;
}
export declare class MockDataStore implements DEngineStore {
    data: DNodeDict;
    constructor();
    fetchInitial(): DNodeDict;
    get(_scope: Scope, id: string): Promise<NodeGetResp>;
}
export declare class ProtoEngine implements DEngine {
    fuse: Fuse<IDNode, any>;
    nodes: DNodeDict;
    fullNodes: Set<string>;
    queries: Set<string>;
    store: DEngineStore;
    static getEngine(): DEngine;
    constructor(store: DEngineStore);
    _nodeInCache(node: IDNode, opts?: QueryOpts): boolean;
    _queryInCache(qs: string): boolean;
    /**
     * Updates local cache
     * @param nodes
     * @param opts
     */
    refreshNodes(nodes: IDNode[], opts?: QueryOpts): void;
    updateLocalCollection(collection: IDNode[]): void;
    get(_scope: Scope, id: string, opts?: QueryOpts): Promise<NodeGetResp>;
    query(scope: Scope, queryString: string, opts?: QueryOpts): Promise<NodeQueryResp>;
}
export declare function engine(): DEngine;
