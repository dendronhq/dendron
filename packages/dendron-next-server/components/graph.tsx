import { createLogger } from "@dendronhq/common-frontend";
import _ from "lodash";
import React, { useEffect, useRef, useState } from "react";
import cytoscape, { Core, ElementsDefinition, EventHandler } from "cytoscape";
// @ts-ignore
import euler from "cytoscape-euler";
import { useRouter } from "next/router";
import { useThemeSwitcher } from "react-css-theme-switcher";
import { Space, Typography } from "antd";
import Head from "next/head";
import AntThemes from "../styles/theme-antd";
import GraphFilterView from "./graph-filter-view";

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
`;
};

type GraphConfigItem<T> = {
  value: T;
  mutable: boolean;
};

type CoreGraphConfig = {
  "information.nodes": GraphConfigItem<number>;
  "information.edges": GraphConfigItem<number>;
  "filter.regex": GraphConfigItem<string>;
};
type NoteGraphConfig = {
  "display.hierarchy"?: GraphConfigItem<boolean>;
  "display.links"?: GraphConfigItem<boolean>;
};
type SchemaGraphConfig = {};

export type GraphConfig = CoreGraphConfig & NoteGraphConfig & SchemaGraphConfig;

const coreGraphConfig: CoreGraphConfig = {
  "information.nodes": {
    value: 0,
    mutable: false,
  },
  "information.edges": {
    value: 0,
    mutable: false,
  },
  "filter.regex": {
    value: "",
    mutable: true,
  },
};

const noteGraphConfig: NoteGraphConfig = {
  "display.hierarchy": {
    value: true,
    mutable: true,
  },
  "display.links": {
    value: false,
    mutable: true,
  },
};

const schemaGraphConfig: SchemaGraphConfig = {};

export default function Graph({
  elements,
  type = "note",
  onSelect,
}: {
  elements: ElementsDefinition | undefined;
  onSelect: EventHandler;
  type?: "note" | "schema";
}) {
  const logger = createLogger("Graph");
  const graphRef = useRef<HTMLDivElement>(null);
  const { themes, currentTheme } = useThemeSwitcher();

  const [cy, setCy] = useState<Core>();

  const [config, setConfig] = useState<GraphConfig>({
    ...(type === "note" ? noteGraphConfig : schemaGraphConfig),
    ...coreGraphConfig,
  });

  const handleUpdateConfig = (
    key: string,
    value: string | number | boolean
  ) => {
    logger.log(key, value);
    setConfig({
      ...config,
      [key]: {
        // @ts-ignore
        ...config[key],
        value,
      },
    });
  };

  logger.log(config);

  useEffect(() => {
    if (graphRef.current && elements) {
      // If the graph already has rendered elements, don't re-render
      // Otherwise, the graph re-renders when elements are selected
      if (cy && cy.elements("*").length > 1) return;

      const isLargeGraph = elements.nodes.length + elements.edges.length > 1000;

      logger.log("Rendering graph...");

      // Add layout middleware
      cytoscape.use(euler);

      const network = cytoscape({
        container: graphRef.current,
        elements,
        style: getCytoscapeStyle(themes, currentTheme) as any,

        // Zoom levels
        minZoom: 0.1,
        maxZoom: 10,

        // Options to improve performance
        textureOnViewport: isLargeGraph,
        hideEdgesOnViewport: isLargeGraph,
        hideLabelsOnViewport: isLargeGraph,
      });

      // Layout graph nodes
      network
        .layout({
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
          maxSimulationTime: 4000,
          ungrabifyWhileSimulating: false,
          fit: true,
          padding: 30,
          boundingBox: undefined,
          randomize: false,
        })
        .run();

      network.on("select", (e) => onSelect(e));

      setCy(network);
    }
  }, [graphRef, elements]);

  useEffect(() => {
    if (elements) {
      setConfig((c) => ({
        ...c,
        "information.nodes": {
          value: elements.nodes.length,
          mutable: false,
        },
        "information.edges": {
          value: elements.edges.length,
          mutable: false,
        },
      }));
    }
  }, [elements]);

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
          setField={handleUpdateConfig}
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
