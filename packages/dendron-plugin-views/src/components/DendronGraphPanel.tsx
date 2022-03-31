import {
  DMessageSource,
  GraphViewMessage,
  GraphViewMessageType,
} from "@dendronhq/common-all";
import { createLogger, postVSCodeMessage } from "@dendronhq/common-frontend";
import { useEffect, useState } from "react";
import useGraphElements from "../hooks/useGraphElements";
import { DendronComponent } from "../types";
import { graphConfig, GraphConfig } from "../utils/graph";
import Graph from "./graph";
import { EventHandler } from "cytoscape";
import _ from "lodash";

const DendronGraphPanel: DendronComponent = (props) => {
  const ctx = "DendronNoteGraphView";
  const logger = createLogger("DendronNoteGraphView");
  logger.info({
    ctx,
    msg: "enter",
    props,
  });
  //const { useEngine } = engineHooks;
  const { workspace, ide, engine } = props;
  // useEngine({ engineState: engine, opts: {url: workspace.url, ws: workspace.ws} });
  let noteActive = props.ide.noteActive;
  const [config, setConfig] = useState<GraphConfig>(graphConfig.note);

  const elements = useGraphElements({
    type: "note",
    engine,
    config,
    noteActive,
  });
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
        "information.edges-links": {
          value: elements.edges.links ? elements.edges.links.length : 0,
          mutable: false,
          label: "Linked Edges",
        },
      }));
    }
  }, [elements]);

  const onSelect: EventHandler = (e) => {
    const { id, source } = e.target[0]._private.data;

    const isNode = !source;
    if (!isNode || !engine.notes) return;
    noteActive = engine.notes[id];
    postVSCodeMessage({
      type: GraphViewMessageType.onSelect,
      data: { id },
      source: DMessageSource.webClient,
    } as GraphViewMessage);
  };

  return (
    <Graph
      elements={elements}
      onSelect={onSelect}
      config={config}
      setConfig={setConfig}
      engine={engine}
      ide={ide}
      type="note"
      workspace={workspace}
    />
  );
};
export default DendronGraphPanel;
