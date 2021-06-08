import { createLogger } from "@dendronhq/common-frontend";
import _ from "lodash";
import React, { useEffect, useRef, useState } from "react";
import cytoscape, {
  Core,
  EdgeDefinition,
  ElementsDefinition,
  EventHandler,
} from "cytoscape";
// @ts-ignore
import euler from "cytoscape-euler";
import { useRouter } from "next/router";
import { useThemeSwitcher } from "react-css-theme-switcher";
import { Space, Typography } from "antd";
import Head from "next/head";
import AntThemes from "../styles/theme-antd";
import GraphFilterView from "./graph-filter-view";
import {
  GraphConfig,
  GraphEdges,
  GraphElements,
  GraphNodes,
} from "../lib/graph";

const getCytoscapeStyle = (themes: any, theme: string | undefined) => {
  if (_.isUndefined(theme)) return "";
  return `
  node {
    width: ${AntThemes[theme].graph.node.size};
    height: ${AntThemes[theme].graph.node.size};
    background-color: ${AntThemes[theme].graph.node.color};
    color: ${AntThemes[theme].graph.node.label.color};
    label: data(label);
    font-size: ${AntThemes[theme].graph.node.label.fontSize};
    min-zoomed-font-size: ${AntThemes[theme].graph.node.label.minZoomedFontSize};
    font-weight: ${AntThemes[theme].graph.node.label.fontWeight};
  }

  edge {
    width: ${AntThemes[theme].graph.edge.width};
    line-color: ${AntThemes[theme].graph.edge.color};
    target-arrow-shape: none;
    curve-style: haystack;
  }

  :selected, .open {
    background-color: ${AntThemes[theme].graph.node._selected.color};
    color: ${AntThemes[theme].graph.node._selected.color};
  }

  .links {
    line-style: dashed;
  }
`;
};

const getEulerConfig = (isLargeGraph: boolean) => ({
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
  animate: !isLargeGraph,
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
}: {
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

  const { nodes, edges } = elements;

  const isLargeGraph = nodes.length + Object.values(edges).flat().length > 1000;

  const applyConfig = () => {
    if (!cy || !graphRef.current) return;

    // "display" rules
    Object.entries(config)
      .filter(([k, v]) => k.includes("connections"))
      .forEach(([k, v]) => {
        const keyArray = k.split(".");
        const edgeType = keyArray[keyArray.length - 1];

        const includedEdges = cy.$(`.${edgeType}`);
        const edgeCount = includedEdges.length;
        logger.log(`${edgeType}:`, edgeCount);

        // If edges should be included
        if (v?.value) {
          // If these edges aren't rendered, add them
          if (edgeCount === 0) {
            cy.add(edges[edgeType]);
          }
        }

        // If edges should not be included
        else {
          // If these edges are rendered, remove them
          if (edgeCount > 0) {
            includedEdges.remove();
          }
        }
      });

    // Only re-layout graph if it will be performant to do so
    if (!isLargeGraph) {
      cy.layout(getEulerConfig(isLargeGraph)).run();
    }
  };

  const renderGraph = () => {
    if (graphRef.current && nodes && edges) {
      logger.log("Rendering graph...");

      let parsedEdges: EdgeDefinition[] = [];

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

      const network = cytoscape({
        container: graphRef.current,
        elements: {
          nodes,
          edges: parsedEdges,
        },
        style: getCytoscapeStyle(themes, currentTheme) as any,

        // Zoom levels
        minZoom: 0.1,
        maxZoom: 10,

        // Options to improve performance
        textureOnViewport: isLargeGraph,
        hideEdgesOnViewport: isLargeGraph,
        hideLabelsOnViewport: isLargeGraph,
      });

      network.layout(getEulerConfig(isLargeGraph)).run();

      network.on("select", (e) => onSelect(e));

      setCy(network);
    }
  };

  // const parseElements = (
  //   elements: cytoscape.ElementsDefinition,
  //   config: GraphConfig
  // ) => {
  //   if (type === "note") {
  //     if (!config["display.hierarchy"]?.value) {
  //       elements.nodes = elements.nodes.filter(
  //         (n) => !n.classes?.includes(".hierarchy")
  //       );
  //     }
  //     if (!config["display.links"]?.value) {
  //       elements.nodes = elements.nodes.filter(
  //         (n) => !n.classes?.includes(".link")
  //       );
  //     }
  //   }

  //   logger.log(elements);
  //   return elements;
  // };

  useEffect(() => {
    // If the graph already has rendered elements, don't re-render
    // Otherwise, the graph re-renders when elements are selected
    if (cy && cy.elements("*").length > 1) return;
    renderGraph();
  }, [graphRef, nodes, edges]);

  useEffect(() => {
    applyConfig();
  }, [config]);

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
        <GraphFilterView type={type} config={config} setConfig={setConfig} />
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
