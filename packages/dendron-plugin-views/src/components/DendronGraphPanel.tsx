import {
  DMessageSource,
  GraphViewMessage,
  GraphViewMessageEnum,
} from "@dendronhq/common-all";
import { createLogger, engineHooks } from "@dendronhq/common-frontend";
import { useEffect, useState } from "react";
import useGraphElements from "../hooks/useGraphElements";
import { DendronComponent } from "../types";
import { graphConfig, GraphConfig } from "../utils/graph";
import Graph from "./graph";
import { EventHandler } from "cytoscape";
import _ from "lodash";
import { postVSCodeMessage } from "../utils/vscode";

const DendronGraphPanel: DendronComponent = (props) => {
  const logger = createLogger("DendronNoteGraphView");
  const { workspace, ide, engine, isSidePanel } = props;
  const { useEngine } = engineHooks;
  // initialize engine. This is necessary because graph view require full note state.
  useEngine({
    engineState: engine,
    opts: { url: workspace.url, ws: workspace.ws },
  });
  let noteActive = props.ide.noteActive;
  logger.info({
    msg: "enter",
    activeNoteId: noteActive ? noteActive.id : "no active note found",
  });

  const [config, setConfig] = useState<GraphConfig>(graphConfig.note);

  const elements = useGraphElements({
    type: "note",
    engine,
    config,
    noteActive,
    wsRoot: workspace.ws,
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

  useEffect(() => {
    if (ide.graphTheme) {
      logger.log("updating graph config with value: ", ide.graphTheme);
      setConfig((c) => ({
        ...c,
        graphTheme: {
          ...c.graphTheme,
          value: ide.graphTheme!,
        },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ide.graphTheme]);

  useEffect(() => {
    if (ide.graphDepth) {
      logger.log("updating graph depth in config ", ide.graphDepth);
      setConfig((c) => ({
        ...c,
        "filter.depth": {
          ...c["filter.depth"],
          value: ide.graphDepth!,
        },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ide.graphDepth]);

  useEffect(() => {
    if (isSidePanel) {
      setConfig((c) => ({
        ...c,
        "connections.links": {
          value: true,
          mutable: true,
        },
        "options.show-local-graph": {
          value: true,
          mutable: true,
        },
      }));
    }
  }, [isSidePanel]);

  const onSelect: EventHandler = (e) => {
    const { id, source } = e.target[0]._private.data;

    const isNode = !source;
    if (!isNode || !engine.notes) return;
    noteActive = engine.notes[id];
    postVSCodeMessage({
      type: GraphViewMessageEnum.onSelect,
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
      isSidePanel={isSidePanel}
    />
  );
};
export default DendronGraphPanel;
