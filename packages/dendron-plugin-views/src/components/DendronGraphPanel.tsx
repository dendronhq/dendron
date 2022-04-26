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
  const { workspace, ide, engine } = props;
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
    const { defaultGraphTheme } = ide;
    if (defaultGraphTheme) {
      // update the graphTheme option in graph config
      logger.log("updating graph config with graph theme: ", defaultGraphTheme);
      setConfig((c) => ({
        ...c,
        graphTheme: {
          ...c.graphTheme,
          value: defaultGraphTheme,
        },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ide.defaultGraphTheme]);

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
    />
  );
};
export default DendronGraphPanel;
