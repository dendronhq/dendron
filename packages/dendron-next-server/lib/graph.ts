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

  "filter.regex-allowlist": GraphConfigItem<string>;
  "filter.regex-blocklist": GraphConfigItem<string>;

  "options.allow-relayout": GraphConfigItem<boolean>;
  "options.show-labels": GraphConfigItem<boolean>;
};

export type NoteGraphConfig = {
  "connections.links"?: GraphConfigItem<boolean>;
  
  "information.edges-links"?: GraphConfigItem<number>;

  "filter.show-stubs"?: GraphConfigItem<boolean>;
};

export type SchemaGraphConfig = {
  "connections.schemas"?: GraphConfigItem<boolean>;
};

export type GraphConfig = CoreGraphConfig & NoteGraphConfig & SchemaGraphConfig;

const coreGraphConfig: CoreGraphConfig = {
  "filter.regex-allowlist": {
    value: "",
    mutable: true,
    label: 'Allowlist',
    placeholder: 'Filenames, labels'
  },
  "filter.regex-blocklist": {
    value: "",
    mutable: true,
    label: 'Blocklist',
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
  "options.allow-relayout": {
    value: true,
    mutable: true,
  },
  "options.show-labels": {
    value: true,
    mutable: true,
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
  "filter.show-stubs": {
    value: true,
    mutable: true,
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