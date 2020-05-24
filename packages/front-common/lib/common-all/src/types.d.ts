export declare type Stage = "dev" | "prod";
export interface IDNode {
    id: string;
    title: string;
    desc: string;
    type: DNodeType;
    updated: string;
    created: string;
    parent: IDNode | null;
    children: IDNode[];
    body?: string;
    url: string;
    path: string;
    addChild(node: IDNode): void;
    renderBody(): string;
    toDocument(): any;
}
export interface DNodeProps {
    id?: string;
    title: string;
    desc: string;
    type: DNodeType;
    updated?: string;
    created?: string;
    parent: IDNode | null;
    children: IDNode[];
    body?: string;
}
export declare type DNodeDict = {
    [id: string]: IDNode;
};
export interface DNodeRaw<T extends INoteData | SchemaData> {
    id: string;
    title: string;
    desc: string;
    type: string;
    updated: string;
    created: string;
    parent: string | null;
    children: string[];
    data: T;
    body?: string;
}
export declare type DNodeType = "note" | "schema";
export declare type INote = IDNode & INoteData;
export declare type INoteProps = Omit<DNodeProps, "parent" | "children"> & Partial<INoteData>;
export declare type INoteData = {
    schemaId: string;
};
export declare type Schema = IDNode & SchemaData;
export declare type SchemaData = {
    pattern: string;
};
/**
 * YAML reprsentation of a Schema
 * Used in Kevin's schema notation
 */
export declare type SchemaYAMLRaw = {
    name: string;
    schema: {
        [key: string]: SchemaYAMLEntryRaw;
    } | {
        root: SchemaYAMLEntryRaw;
    };
};
export declare type SchemaYAMLEntryRaw = SchemaData & {
    children: {
        [key: string]: any;
    };
};
export interface Resp<T> {
    data: T;
    error?: Error | null;
}
export declare type NodeGetResp = Resp<IDNode>;
export declare type NodeQueryResp = Resp<IDNode[]>;
export interface Scope {
    username: string;
}
export interface QueryOpts {
    fullNode?: boolean;
    webClient?: boolean;
    queryOne?: boolean;
}
export interface DEngineStore {
    get: (scope: Scope, id: string, opts?: QueryOpts) => Promise<NodeGetResp>;
    query: (scope: Scope, queryString: string, opts?: QueryOpts) => Promise<NodeQueryResp>;
}
/**
 * Query: path based
 * Get: id based
 */
export interface DEngine {
    nodes: DNodeDict;
    /**
     * Get node based on id
     * get(id: ...)
     */
    get: (scope: Scope, id: string, opts?: QueryOpts) => Promise<NodeGetResp>;
    /**
     * Get node based on query
     * query(scope: {username: lukesernau}, queryString: "project", nodeType: note)
     * - []
     * - [Node(id: ..., title: project, children: [])]
     */
    query: (scope: Scope, queryString: string, opts?: QueryOpts) => Promise<NodeQueryResp>;
}
