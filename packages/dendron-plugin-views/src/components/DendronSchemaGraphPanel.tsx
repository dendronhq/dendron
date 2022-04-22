import { postVSCodeMessage } from "../utils/vscode";
import _ from "lodash";
import { useEffect, useState } from "react";
import { EventHandler } from "cytoscape";
import Graph from "./graph";
import useGraphElements from "../hooks/useGraphElements";
import { graphConfig, GraphConfig } from "../utils/graph";
import {
  DMessageSource,
  GraphViewMessage,
  GraphViewMessageEnum,
} from "@dendronhq/common-all";
import { createLogger, engineHooks } from "@dendronhq/common-frontend";
import { DendronComponent } from "../types";

const DendronSchemaGraphPanel: DendronComponent = (props) => {
  const logger = createLogger("DendronSchemaGraphView");
  const { workspace, ide, engine } = props;
  const { useEngine } = engineHooks;
  // initialize engine. This is necessary because graph view require full engine state.
  useEngine({
    engineState: engine,
    opts: { url: workspace.url, ws: workspace.ws },
  });
  logger.info({
    msg: "enter",
  });
  const [config, setConfig] = useState<GraphConfig>(graphConfig.schema);
  const elements = useGraphElements({
    type: "schema",
    engine,
    config,
    wsRoot: workspace.ws,
  });

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
        type: GraphViewMessageEnum.onSelect,
        data: { id: fname, vault },
        source: DMessageSource.webClient,
      } as GraphViewMessage);
    } else {
      postVSCodeMessage({
        type: GraphViewMessageEnum.onSelect,
        data: { id: fname },
        source: DMessageSource.webClient,
      } as GraphViewMessage);
    }
  };

  logger.info({
    msg: "exit",
  });
  return (
    <Graph
      elements={elements}
      onSelect={onSelect}
      type="schema"
      config={config}
      setConfig={setConfig}
      engine={engine}
      ide={ide}
      workspace={workspace}
    />
  );
};

export default DendronSchemaGraphPanel;
