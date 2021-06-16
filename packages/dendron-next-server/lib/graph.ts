import { EdgeDefinition, NodeDefinition } from "cytoscape";

export type GraphNodes = NodeDefinition[]
export type GraphEdges = {
  [id: string]: EdgeDefinition[]
}
export type GraphElements = {
  nodes: GraphNodes,
  edges: GraphEdges
}


export type GraphConfigItem<T> = {
  value: T;
  mutable: boolean;
  label?: string;
  placeholder?: string;
};

export type CoreGraphConfig = {
  "connections.hierarchy"?: GraphConfigItem<boolean>;

  "information.edges-hierarchy"?: GraphConfigItem<number>;
  "information.nodes": GraphConfigItem<number>;

  "filter.regex-whitelist": GraphConfigItem<string>;
  "filter.regex-blacklist": GraphConfigItem<string>;
};

export type NoteGraphConfig = {
  "connections.links"?: GraphConfigItem<boolean>;
  
  "information.edges-links"?: GraphConfigItem<number>;
};

export type SchemaGraphConfig = {
  "connections.schemas"?: GraphConfigItem<boolean>;
};

export type GraphConfig = CoreGraphConfig & NoteGraphConfig & SchemaGraphConfig;

const coreGraphConfig: CoreGraphConfig = {
  "filter.regex-whitelist": {
    value: "",
    mutable: true,
    label: 'Whitelist',
    placeholder: 'Filenames, labels'
  },
  "filter.regex-blacklist": {
    value: "",
    mutable: true,
    label: 'Blacklist',
    placeholder: 'Filenames, labels'
  },
  "connections.hierarchy": {
    value: true,
    mutable: true,
  },

  "information.edges-hierarchy": {
    value: 0,
    mutable: false,
  },
  "information.nodes": {
    value: 0,
    mutable: false,
  },
};

const noteGraphConfig: NoteGraphConfig = {
  "connections.links": {
    value: false,
    mutable: true,
  },
  "information.edges-links": {
    value: 0,
    mutable: false,
  },
};

const schemaGraphConfig: SchemaGraphConfig = {
};

export const graphConfig = {
  note: {
    ...noteGraphConfig,
    ...coreGraphConfig
  },
  schema: {
    ...schemaGraphConfig,
    ...coreGraphConfig
  },
}