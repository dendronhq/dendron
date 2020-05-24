import { DEngineStore, NodeGetResp, NodeQueryResp, QueryOpts, Scope } from "../../types";
export declare class DropboxStorage implements DEngineStore {
    private client;
    constructor();
    get(_scope: Scope, id: string, opts?: QueryOpts): Promise<NodeGetResp>;
    query(_scope: Scope, queryString: string, _opts?: QueryOpts): Promise<NodeQueryResp>;
}
