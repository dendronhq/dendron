import {
  NodeDict,
  NoteNodeStub,
  NoteStubDict,
  SchemaNode,
  SchemaNodeDict,
} from "../../common/types";

import { SchemaTree } from "../../common/node";
import { createSlice } from "@reduxjs/toolkit";

// === BEGIN PROTO {
const YAML_PROJECT_BASE = `
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
const YAML_PROJECT_DEV = `
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

const rootSchemaNode: SchemaNode = {
  id: "root",
  children: [],
  parent: null,
  data: { title: "root", desc: "root", type: "schema" },
};
const initialTree = new SchemaTree("root", rootSchemaNode);
const treeProjectBase = SchemaTree.fromSchemaYAML(YAML_PROJECT_BASE);
const treeProjectDev = SchemaTree.fromSchemaYAML(YAML_PROJECT_DEV);
initialTree.addSubTree(treeProjectBase, rootSchemaNode.id);
initialTree.addSubTree(treeProjectDev, rootSchemaNode.id);
console.log(initialTree);

const rootStub: NoteNodeStub = {
  id: "root/note",
  data: { title: "root", desc: "root", type: "note", schemaId: "-1" },
};

const bondStub: NoteNodeStub = {
  id: "bond2",
  data: { title: "bond2", desc: "bond2", type: "note", schemaId: "-1" },
};

const initialNoteStubs = {
  root: rootStub,
  bond: bondStub,
};

const initialNodes: NodeDict = {
  [rootStub.id]: {
    ...rootStub,
    body: "This is the root",
    parent: null,
    children: [bondStub],
  },
  [bondStub.id]: {
    ...bondStub,
    body: "This is the bond node",
    parent: rootStub,
    children: [],
  },
};

// === } END PROTO

export interface NodeState {
  schemaDict: SchemaNodeDict;
  noteStubDict: NoteStubDict;
  treeOrientation: "vertical" | "horizontal";
  nodeDict: NodeDict;
  activeNodeId: string;
}

const initialState: NodeState = {
  schemaDict: { ...initialTree.nodes },
  noteStubDict: { ...initialNoteStubs },
  treeOrientation: "horizontal",
  activeNodeId: "root/note",
  nodeDict: { ...initialNodes },
};

const nodeSlice = createSlice({
  name: "node",
  initialState,
  reducers: {},
});

const effects = {
  nodeEffect: () => {
    // some function with an effect
    return;
  },
};

const { reducer, actions } = nodeSlice;
export {
  reducer as nodeReducer,
  actions as nodeActions,
  effects as nodeEffects,
};
