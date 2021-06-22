import {
  createLogger,
  engineSlice,
  postVSCodeMessage,
} from "@dendronhq/common-frontend";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { ElementsDefinition, EventHandler } from "cytoscape";
import Graph from "../../components/graph";
import useGraphElements from "../../hooks/useGraphElements";
import { GraphConfig, graphConfig } from "../../lib/graph";
import GraphFilterView from "../../components/graph-filter-view";
import {
  DMessageSource,
  GraphViewMessage,
  GraphViewMessageType,
} from "@dendronhq/common-all";

export default function FullSchemaGraph({
  engine,
}: {
  engine: engineSlice.EngineState;
}) {
  const [config, setConfig] = useState<GraphConfig>(graphConfig.schema);
  const elements = useGraphElements({ type: "schema", engine });

  const onSelect: EventHandler = (e) => {
    const { id, source, vault } = e.target[0]._private.data;

    const idSections = id.split("_");
    const rootID = idSections[idSections.length - 1];

    // Exists if the node is a subschema
    const fname = e.target[0]._private.data.fname || rootID;

    const isNode = !source;
    if (!isNode) return;

    if (vault) {
      postVSCodeMessage({
        type: GraphViewMessageType.onSelect,
        data: { id: fname, vault },
        source: DMessageSource.webClient,
      } as GraphViewMessage);
    } else {
      postVSCodeMessage({
        type: GraphViewMessageType.onSelect,
        data: { id: fname },
        source: DMessageSource.webClient,
      } as GraphViewMessage);
    }
  };

  // Update config
  useEffect(() => {
    if (!_.isUndefined(elements)) {
      setConfig((c) => ({
        ...c,
        "information.nodes": {
          value: elements.nodes.length,
          mutable: false,
        },
        "information.edges-hierarchy": {
          value: elements.edges.hierarchy ? elements.edges.hierarchy.length : 0,
          mutable: false,
          label: "Hierarchical Edges",
        },
      }));
    }
  }, [elements]);

  return (
    <Graph
      elements={elements}
      onSelect={onSelect}
      type="schema"
      config={config}
      setConfig={setConfig}
      engine={engine}
    />
  );
}
