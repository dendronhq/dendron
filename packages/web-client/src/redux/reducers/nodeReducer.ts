import { IDNode, QueryOpts } from "../../common/types";
import { ThunkAction, createSlice } from "@reduxjs/toolkit";

import { Action } from "./types";
import { Logger } from "@aws-amplify/core";
import { ProtoEngine } from "../../proto/engine";
import { ReduxState } from ".";
import _ from "lodash";

const logger = new Logger("nodeReducer");

// === BEGIN PROTO {
// @ts-ignore - TODO
export const YAML_PROJECT_BASE = `
  name: project
  schema:
      root:
        children:
          quickstart: 
          topic: 
          version: 
          features:
          rel:
      quickstart:
        desc: get started with project
      features:
        desc: what does it do
      ref:
        kind: namespace
        choices:
            competitors: 
            shortcuts:
      rel:
        desc: relative
      version:
        children:
          version-major: 
          version-minor: 
          version-breaking: 
      plan:
        children:
          requirements:
            alias: req
          timeline:
            desc: "how long will it take"
      version-major:
        desc: the major version
`;
// @ts-ignore TODO
export const YAML_PROJECT_DEV = `
  name: dev project
  schema: 
    root:
      children: 
        upgrade:
        dev:
        ref:
    dev:
      children:
        dev-layout: 
        architecture:
          alias: arch        
        qa:
        ops:
    ref:
      children:
        config:
        lifecycle:
    config: 
`;

// const rootSchemaNode: SchemaNode = {
//   id: "root",
//   children: [],
//   parent: null,
//   data: { title: "root", desc: "root", type: "schema" },
// };
// const initialTree = new SchemaTree("root", rootSchemaNode);
// const treeProjectBase = SchemaTree.fromSchemaYAML(YAML_PROJECT_BASE);
// const treeProjectDev = SchemaTree.fromSchemaYAML(YAML_PROJECT_DEV);
// initialTree.addSubTree(treeProjectBase, rootSchemaNode.id);
// initialTree.addSubTree(treeProjectDev, rootSchemaNode.id);
// console.log(initialTree);

// const rootStub: NoteNodeStub = {
//   id: "root/note",
//   data: { title: "root", desc: "root", type: "note", schemaId: "-1" },
// };

// === } END PROTO

export interface NodeState {
  // schemaDict: SchemaNodeDict;
  // noteStubDict: NoteStubDict;
  // treeOrientation: "vertical" | "horizontal";
  activeNodeId: string;
}

export interface SetActiveNodeIdAction extends Action<{ id: string }> {
  payload: {
    id: string;
  };
}

const initialState: NodeState = {
  // get(): Promise<DNode>
  //
  // schemaDict: { ...initialTree.nodes },
  // noteStubDict: { ...initialNoteStubs },
  // treeOrientation: "horizontal",
  activeNodeId: "",
  // engine.get(activeNodeID)
  // engine
};

const nodeSlice = createSlice({
  name: "node",
  initialState,
  reducers: {
    setActiveNodeId(state: NodeState, action: SetActiveNodeIdAction) {
      state.activeNodeId = action.payload.id;
    },
  },
});

type FetchNodeThunk = ThunkAction<
  Promise<IDNode>,
  ReduxState,
  null,
  Action<string>
>;
type FetchNodesThunk = ThunkAction<
  Promise<IDNode[]>,
  ReduxState,
  null,
  Action<string>
>;

type GetNodeThunk = ThunkAction<
  Promise<IDNode>,
  ReduxState,
  null,
  Action<string>
>;

type GetAllStubsThunk = ThunkAction<
  Promise<IDNode[]>,
  ReduxState,
  null,
  Action<string>
>;

const effects = {
  /**
   * Fetch full node
   */
  queryOne: (query: string): FetchNodeThunk => async () => {
    //TODO
    const scope = { username: "kevin" };
    const engine = ProtoEngine.getEngine();
    const resp = await engine.query(scope, query, { fullNode: true });
    logger.debug({ ctx: "queryOne:exit", resp });
    // FIXME: verify
    return resp.data[0];
  },
  query: (query: string, opts?: QueryOpts): FetchNodesThunk => async () => {
    //TODO
    opts = _.defaults(opts || {}, { fullNode: false });
    const scope = { username: "kevin" };
    const engine = ProtoEngine.getEngine();
    const resp = await engine.query(scope, query, opts);
    // FIXME: verify
    return resp.data;
  },
  getNode: (id: string): GetNodeThunk => async () => {
    //TODO
    const scope = { username: "kevin" };
    const engine = ProtoEngine.getEngine();
    const resp = await engine.get(scope, id, {
      fullNode: true,
    });
    // FIXME: verify
    return resp.data;
  },
  getAllStubs: (): GetAllStubsThunk => async () => {
    const scope = { username: "kevin" };
    const engine = ProtoEngine.getEngine();
    const resp = await engine.query(scope, "**/*", { fullNode: false });
    return resp.data;
  },
};

const { reducer, actions } = nodeSlice;
export {
  reducer as nodeReducer,
  actions as nodeActions,
  effects as nodeEffects,
};
