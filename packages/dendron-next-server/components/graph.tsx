import { createLogger, engineSlice, postVSCodeMessage } from "@dendronhq/common-frontend";
import _ from "lodash";
import React, { useEffect, useRef, useState } from "react";
import cytoscape, { Core, EdgeDefinition, EventHandler, use } from "cytoscape";
import euler from "cytoscape-euler";
import { useThemeSwitcher } from "react-css-theme-switcher";
import Head from "next/head";
import AntThemes from "../styles/theme-antd";
import GraphFilterView from "./graph-filter-view";
import { GraphConfig, GraphConfigItem, GraphElements } from "../lib/graph";
import { DMessageSource, GraphViewMessage, GraphViewMessageType, VaultUtils } from "@dendronhq/common-all";
import useApplyGraphConfig from "../hooks/useApplyGraphConfig";
import { DendronProps } from "../lib/types";
import useSyncGraphWithIDE from "../hooks/useSyncGraphWithIDE";

export class GraphUtils {
  static isLocalGraph(config: GraphConfig) {
    if (_.isUndefined(config["options.show-local-graph"])) return false;
    return config["options.show-local-graph"].value;
  }
}

const getCytoscapeStyle = (themes: any, theme: string | undefined, customCSS: string | undefined) => {
  if (_.isUndefined(theme)) return "";

  // Cytoscape's "diamond" node is smaller than it's "circle" node, so
  // this modifier adjusts to make parent and child nodes similarly sized.
  const PARENT_NODE_SIZE_MODIFIER = 1.25;

  return `
node {
  width: ${AntThemes[theme].graph.node.size};
  height: ${AntThemes[theme].graph.node.size};
  background-color: ${AntThemes[theme].graph.node.color};
  color: ${AntThemes[theme].graph.node.label.color};
  label: data(label);
  font-size: ${AntThemes[theme].graph.node.label.fontSize};
  min-zoomed-font-size: ${
    AntThemes[theme].graph.node.label.minZoomedFontSize
  };
  font-weight: ${AntThemes[theme].graph.node.label.fontWeight};
}

edge {
  width: ${AntThemes[theme].graph.edge.width};
  line-color: ${AntThemes[theme].graph.edge.color};
  target-arrow-shape: none;
  curve-style: haystack;
}

:selected{
  background-color: ${AntThemes[theme].graph.node._selected.color};
  color: ${AntThemes[theme].graph.node._selected.color};
}

.parent {
  shape: diamond;
  width: ${AntThemes[theme].graph.node.size * PARENT_NODE_SIZE_MODIFIER};
  height: ${AntThemes[theme].graph.node.size * PARENT_NODE_SIZE_MODIFIER};
}

.links {
  line-style: dashed;
}

.hidden--labels {
  label: ;
}

.hidden--vault,
.hidden--regex-allowlist,
.hidden--regex-blocklist,
.hidden--stub {
  display: none;
}

${customCSS || ""}
`;
};

export const getEulerConfig = (shouldAnimate: boolean) => ({
  name: "euler",
  // @ts-ignore
  springLength: () => 80,
  springCoeff: () => 0.0008,
  mass: () => 4,
  gravity: -1.2,
  pull: 0.0001,
  theta: 0.666,
  dragCoeff: 0.02,
  movementThreshold: 1,
  timeStep: 20,
  refresh: 10,
  animate: shouldAnimate,
  animationDuration: undefined,
  animationEasing: undefined,
  maxIterations: 1000,
  maxSimulationTime: 1000,
  ungrabifyWhileSimulating: false,
  fit: true,
  padding: 30,
  boundingBox: undefined,
  randomize: false,
});

export default function Graph({
  elements,
  type = "note",
  onSelect,
  config,
  setConfig,
  engine,
  ide,
}: DendronProps & {
  elements: GraphElements;
  onSelect: EventHandler;
  config: GraphConfig;
  setConfig: React.Dispatch<React.SetStateAction<GraphConfig>>;
  type?: "note" | "schema";
}) {
  const logger = createLogger("Graph");
  const graphRef = useRef<HTMLDivElement>(null);
  const { themes, currentTheme } = useThemeSwitcher();
  const [cy, setCy] = useState<Core>();
  const [isGraphLoaded, setIsGraphLoaded] = useState(false);

  useSyncGraphWithIDE({
    graph: cy,
    engine,
    ide,
    config,
  });

  // On config update, handle graph changes
  useApplyGraphConfig({
    graph: cy,
    config,
    elements,
  });

  const { nodes, edges } = elements;
  const isLargeGraph = nodes.length + Object.values(edges).flat().length > 1000;

  useEffect(() => {
    logger.log("styles:", ide.graphStyles)
  }, [ide]);

  const renderGraph = () => {
    if (graphRef.current && nodes && edges) {
      logger.log("Rendering graph...");

      const parsedEdges: EdgeDefinition[] = [];

      // Filter elements using config
      Object.entries(config)
        .filter(([k, v]) => k.includes("connections"))
        .forEach(([k, v]) => {
          if (v?.value) {
            const keyArray = k.split(".");
            const edgeType = keyArray[keyArray.length - 1];
            const edgesToAdd = edges[edgeType];
            if (edgesToAdd) parsedEdges.push(...edgesToAdd);
          }
        });

      // Add layout middleware
      cytoscape.use(euler);

      const style =  getCytoscapeStyle(themes, currentTheme, ide.graphStyles) as any

      logger.log(style)

      const network = cytoscape({
        container: graphRef.current,
        elements: {
          nodes,
          edges: parsedEdges,
        },
        style,

        // Zoom levels
        minZoom: 0.25,
        maxZoom: 5,

        // Options to improve performance
        textureOnViewport: isLargeGraph,
        hideEdgesOnViewport: isLargeGraph,
        hideLabelsOnViewport: isLargeGraph,
      });

      const shouldAnimate =
        type === "schema" ||
        (!isLargeGraph && !GraphUtils.isLocalGraph(config));

      network.layout(getEulerConfig(shouldAnimate)).run();

      // Show UI when layout is finished. As a fallback, show on interaction with graph.
      network.on("layoutstop viewport", () => {
        if (!isGraphLoaded) setIsGraphLoaded(true);
      });

      network.on("select", (e) => onSelect(e));

      setCy(network);
    }
  };

  useEffect(() => {
    logger.log('Requesting graph style...')
    // Get graph style
    postVSCodeMessage({
      type: GraphViewMessageType.onRequestGraphStyle,
      data: { },
      source: DMessageSource.webClient,
    } as GraphViewMessage);
  }, []);

  useEffect(() => {
    // If changed from local graph to full graph, re-render graph to show all elements
    const wasLocalGraph = cy && cy.$("node[localRoot]").length > 0;

    // If the graph already has rendered elements, don't re-render
    // Otherwise, the graph re-renders when elements are selected
    if (
      !GraphUtils.isLocalGraph(config) &&
      !wasLocalGraph &&
      cy &&
      cy.elements("*").length > 1
    )
      return;
    renderGraph();
  }, [graphRef, elements, ide.graphStyles]);

  useEffect(() => {
    // If initial vault data received
    if (engine.vaults && !Object.keys(config).includes("vaults")) {
      // Get config options for all vaults
      const vaultConfigObject: {
        [key: string]: GraphConfigItem<boolean>;
      } = engine.vaults.reduce((dict, vault) => {
        const name = VaultUtils.getName(vault);
        const key = `vaults.${name}`;
        const item: GraphConfigItem<boolean> = {
          value: true,
          mutable: true,
          label: name,
        };

        return {
          ...dict,
          [key]: item,
        };
      }, {});

      // Add vault config options to graph config
      setConfig((c) => ({
        ...c,
        ...vaultConfigObject,
      }));
    }
  }, [engine.vaults]);

  return (
    <>
      <Head>
        <title>{_.capitalize(type)} Graph</title>
      </Head>
      <div
        id="graph"
        style={{
          width: "100vw",
          height: "100vh",
          position: "relative",
        }}
      >
        <GraphFilterView
          type={type}
          config={config}
          setConfig={setConfig}
          isVisible={isGraphLoaded}
        />
        <div
          ref={graphRef}
          style={{
            width: "100%",
            height: "100%",
            zIndex: 1,
          }}
        />
      </div>
    </>
  );
}
