import { IDNode, QueryOpts } from "../../common/types";
import { ThunkAction } from "@reduxjs/toolkit";
import { Action } from "./types";
import { ReduxState } from ".";
export declare const YAML_PROJECT_BASE = "\n  name: project\n  schema:\n      root:\n        children:\n          quickstart: \n          topic: \n          version: \n          features:\n          rel:\n      quickstart:\n        desc: get started with project\n      features:\n        desc: what does it do\n      ref:\n        kind: namespace\n        choices:\n            competitors: \n            shortcuts:\n      rel:\n        desc: relative\n      version:\n        children:\n          version-major: \n          version-minor: \n          version-breaking: \n      plan:\n        children:\n          requirements:\n            alias: req\n          timeline:\n            desc: \"how long will it take\"\n      version-major:\n        desc: the major version\n";
export declare const YAML_PROJECT_DEV = "\n  name: dev project\n  schema: \n    root:\n      children: \n        upgrade:\n        dev:\n        ref:\n    dev:\n      children:\n        dev-layout: \n        architecture:\n          alias: arch        \n        qa:\n        ops:\n    ref:\n      children:\n        config:\n        lifecycle:\n    config: \n";
export interface NodeState {
    activeNodeId: string;
}
export interface SetActiveNodeIdAction extends Action<{
    id: string;
}> {
    payload: {
        id: string;
    };
}
declare const effects: {
    /**
     * Fetch full node
     */
    queryOne: (query: string) => ThunkAction<Promise<IDNode>, ReduxState, null, Action<string>>;
    query: (query: string, opts?: QueryOpts | undefined) => ThunkAction<Promise<IDNode[]>, ReduxState, null, Action<string>>;
    getNode: (id: string) => ThunkAction<Promise<IDNode>, ReduxState, null, Action<string>>;
    getAllStubs: () => ThunkAction<Promise<IDNode[]>, ReduxState, null, Action<string>>;
};
declare const reducer: import("redux").Reducer<NodeState, import("redux").AnyAction>, actions: import("@reduxjs/toolkit").CaseReducerActions<{
    setActiveNodeId(state: NodeState, action: SetActiveNodeIdAction): void;
}>;
export { reducer as nodeReducer, actions as nodeActions, effects as nodeEffects, };
