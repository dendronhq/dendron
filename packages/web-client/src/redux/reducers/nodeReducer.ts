import { SchemaNode, SchemaNodeDict } from "../../common/types";

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
  logicalId: "root",
  children: [],
  parent: null,
  data: { title: "root", desc: "root" },
};
const initialTree = new SchemaTree("root", rootSchemaNode);
const treeProjectBase = SchemaTree.fromSchemaYAML(YAML_PROJECT_BASE);
const treeProjectDev = SchemaTree.fromSchemaYAML(YAML_PROJECT_DEV);
initialTree.addSubTree(treeProjectBase, rootSchemaNode.logicalId);
initialTree.addSubTree(treeProjectDev, rootSchemaNode.logicalId);
console.log(initialTree);

// === } END PROTO

export interface NodeState {
  schemaDict: SchemaNodeDict;
  treeOrientation: "vertical" | "horizontal";
}

const initialState: NodeState = {
  schemaDict: { ...initialTree.nodes },
  treeOrientation: "horizontal",
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
