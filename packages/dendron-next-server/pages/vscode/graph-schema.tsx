import { createLogger, engineSlice } from "@dendronhq/common-frontend";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { ElementsDefinition, EventHandler } from "cytoscape";
import Graph from "../../components/graph";
import useGraphElements from "../../hooks/useGraphElements";
import { GraphConfig, graphConfig } from "../../lib/graph";
import GraphFilterView from "../../components/graph-filter-view";

export default function FullSchemaGraph({
  engine,
}: {
  engine: engineSlice.EngineState;
}) {
  const [config, setConfig] = useState<GraphConfig>(graphConfig.schema);
  const elements = useGraphElements({ type: "schema", engine });

  const onSelect: EventHandler = (e) => {
    const { id, source } = e.target[0]._private.data;

    const isNode = !source;
    if (!isNode) return;

    // TODO: Implement schema opening
    //   postVSCodeMessage({
    //     type: GraphViewMessageType.onSelect,
    //     data: { id },
    //     source: DMessageSource.webClient,
    //   } as GraphViewMessage);
  };

  return (
    <Graph
      elements={elements}
      onSelect={onSelect}
      type="schema"
      config={config}
      setConfig={setConfig}
    />
  );
}
