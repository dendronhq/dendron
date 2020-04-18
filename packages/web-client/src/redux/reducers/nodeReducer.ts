import { SchemaNode, SchemaNodeDict } from "../../common/types";

import { SchemaTree } from "../../common/node";
import { createSlice } from "@reduxjs/toolkit";

// === BEGIN PROTO {
const SAMPLE_YAML = `
  name: project
  schema:
      root:
        children:
          quickstart: 
          topic: 
          version: 
          dev: 
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
`;

const rootSchemaNode: SchemaNode = {
  id: "root",
  logicalId: "root",
  children: [],
  parent: null,
  data: { title: "root", desc: "root" },
};
const initialTree = new SchemaTree("root", rootSchemaNode);
const yamlData = SchemaTree.fromSchemaYAML(SAMPLE_YAML);
initialTree.addSubTree(yamlData, rootSchemaNode.logicalId);

// === } END PROTO

export interface NodeState {
  schemaDict: SchemaNodeDict;
}

const initialState: NodeState = {
  schemaDict: { ...initialTree.nodes },
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
