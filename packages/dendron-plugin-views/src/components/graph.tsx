import { createLogger } from "@dendronhq/common-frontend";
import _ from "lodash";
import React, { useEffect, useRef, useState } from "react";
import cytoscape, { Core, EdgeDefinition, EventHandler } from "cytoscape";
import euler from "cytoscape-euler";
import AntThemes from "../styles/theme-antd";
import GraphFilterView from "./GraphFilterView";
import { GraphConfig, GraphConfigItem, GraphElements } from "../utils/graph";
import {
  ConfigUtils,
  DMessageSource,
  GraphThemeEnum,
  GraphTypeEnum,
  GraphViewMessage,
  GraphViewMessageEnum,
  VaultUtils,
  assertUnreachable,
} from "@dendronhq/common-all";
import useApplyGraphConfig from "../hooks/useApplyGraphConfig";
import { DendronProps } from "../types";
import useSyncGraphWithIDE from "../hooks/useSyncGraphWithIDE";
import { Button, Space, Spin, Typography } from "antd";
import { useCurrentTheme, useWorkspaceProps } from "../hooks";
import { postVSCodeMessage } from "../utils/vscode";
import { getStyles } from "../styles/custom";
import ClassicTheme from "../styles/theme-classic";
import BlockTheme from "../styles/theme-block";
import MonokaiTheme from "../styles/theme-monokai";
import popper from "cytoscape-popper";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";

export class GraphUtils {
  static isLocalGraph(config: GraphConfig) {
    if (_.isUndefined(config["options.show-local-graph"])) return false;
    return config["options.show-local-graph"].value;
  }
}

const getCytoscapeStyle = (
  theme: string | undefined,
  customCSS: string | undefined,
  config: GraphConfig,
  isSidePanel: boolean | undefined
) => {
  if (_.isUndefined(theme)) return "";

  switch (config.graphTheme.value) {
    case GraphThemeEnum.Classic: {
      return getStyles(theme, ClassicTheme, isSidePanel);
    }
    case GraphThemeEnum.Monokai: {
      return getStyles(theme, MonokaiTheme, isSidePanel);
    }
    case GraphThemeEnum.Block: {
      return getStyles(theme, BlockTheme, isSidePanel);
    }
    case GraphThemeEnum.Custom: {
      return getStyles(theme, ClassicTheme, isSidePanel, customCSS);
    }
    default:
      assertUnreachable(config.graphTheme.value);
  }
};

export const getEulerConfig = (shouldAnimate: boolean) => ({
  name: "euler",
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
  maxSimulationTime: 4000,
  ungrabifyWhileSimulating: false,
  fit: true,
  padding: 30,
  boundingBox: undefined,
  randomize: false,
});

cytoscape.use(popper);

export default function Graph({
  elements,
  type,
  onSelect,
  config,
  setConfig,
  engine,
  ide,
  isSidePanel,
}: DendronProps & {
  elements: GraphElements;
  onSelect: EventHandler;
  config: GraphConfig;
  setConfig: React.Dispatch<React.SetStateAction<GraphConfig>>;
  type: "note" | "schema";
}) {
  const logger = createLogger("Graph");
  const graphRef = useRef<HTMLDivElement>(null);
  const { currentTheme } = useCurrentTheme();
  const [cy, setCy] = useState<Core>();
  const [isReady, setIsReady] = useState(false);
  const [workspace] = useWorkspaceProps();
  useSyncGraphWithIDE({
    graph: cy,
    engine,
    ide,
    config,
    workspace,
    isSidePanel,
  });
  // maps node id with its tooltip
  const id2tooltip: { [key: string]: any } = {};

  // On config update, handle graph changes
  useApplyGraphConfig({
    graph: cy,
    config,
    elements,
  });

  const { nodes, edges } = elements;
  const isLargeGraph = nodes.length + Object.values(edges).flat().length > 1000;

  const SwitchButton = ({
    children,
    val,
    update,
  }: {
    children: (val: boolean | undefined) => React.ReactNode;
    val: boolean | undefined;
    update: (val: boolean) => void;
  }) => (
    <Button
      onClick={() => {
        update(!val);
        toggleGraphView(val);
      }}
    >
      {children(val)}
    </Button>
  );

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

      const style = getCytoscapeStyle(
        currentTheme || "light",
        ide.graphStyles,
        config,
        isSidePanel
      ) as any;
      const defaultConfig = ConfigUtils.genDefaultConfig();

      const network = cytoscape({
        boxSelectionEnabled: false,
        container: graphRef.current,
        elements: {
          nodes,
          edges: parsedEdges,
        },
        style,
        wheelSensitivity: ConfigUtils.getWorkspace(
          engine.config || defaultConfig
        ).graph.zoomSpeed,

        // Zoom levels
        minZoom: 0.1,
        maxZoom: 5,

        // Options to improve performance
        textureOnViewport: isLargeGraph,
        hideEdgesOnViewport: isLargeGraph,
        hideLabelsOnViewport: isLargeGraph,
      });

      let renderTimeout: NodeJS.Timeout;

      // When rendering stops, mark the graph as ready
      network.on("render", () => {
        if (isReady) return;
        if (renderTimeout) clearTimeout(renderTimeout);
        renderTimeout = setTimeout(() => {
          setIsReady(true);
        }, 1000);
      });

      network.nodes().unbind("mouseover");
      network.nodes().bind("mouseover", (event) => {
        // make tooltip for node
        makePopperWithTippy(event.target, id2tooltip);
        id2tooltip[event.target.id()].show();
      });

      network.nodes().unbind("mouseout");
      network.nodes().bind("mouseout", (event) => {
        id2tooltip[event.target.id()].destroy();
      });

      const shouldAnimate =
        type === "schema" ||
        (!isLargeGraph && !GraphUtils.isLocalGraph(config));

      network.layout(getEulerConfig(shouldAnimate)).run();

      network.on("select", (e) => onSelect(e));

      setCy(network);
    }
  };

  useEffect(() => {
    logger.log("Requesting graph opts");
    // Get graph style
    postVSCodeMessage({
      type: GraphViewMessageEnum.onRequestGraphOpts,
      data: {},
      source: DMessageSource.webClient,
    } as GraphViewMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    ) {
      return;
    }

    renderGraph();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphRef, elements, ide.graphStyles]);

  // re-render graph if graph style is changed.
  useEffect(() => {
    renderGraph();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.graphTheme.value, ide.showBacklinks, ide.showOutwardLinks]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.vaults]);

  const updateConfigField = (key: string, value: string | number | boolean) => {
    setConfig((c) => {
      let additionalChanges = {};
      if (key === "options.show-local-graph") {
        // Show loading spinner when switching graph types
        setIsReady(false);

        // By default, hide links from full graph and show links for local graph
        additionalChanges = {
          "connections.links": {
            ...c["connections.links"],
            value,
          },
        };
      }

      const newConfig = {
        ...c,
        ...additionalChanges,
        [key]: {
          // @ts-ignore
          ...c[key],
          value,
        },
      };
      return newConfig;
    });
  };

  const showNoteGraphMessage =
    type === "note" && !ide.noteActive && GraphUtils.isLocalGraph(config);

  if (engine.error) {
    return (
      <div>
        <h1>Error</h1>
        <div>{engine.error}</div>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          position: "absolute",
          top: 0,
          left: 0,
          display: isReady && !showNoteGraphMessage ? "none" : "grid",
          placeItems: "center",
          background: currentTheme
            ? AntThemes[currentTheme].graph.filterView.background
            : "transparent",
        }}
      >
        {!isReady && <Spin size="large" />}
        {isReady && showNoteGraphMessage && (
          <NoteGraphMessage
            updateConfigField={updateConfigField}
            setIsReady={setIsReady}
            isSidePanel={isSidePanel}
          />
        )}
      </div>
      <div
        id="graph"
        style={{
          width: "100vw",
          height: "100vh",
          position: "relative",
          opacity: isReady ? 1 : 0,
        }}
      >
        {!isSidePanel && (
          <GraphFilterView
            config={config}
            isGraphReady={isReady}
            updateConfigField={updateConfigField}
            customCSS={ide.graphStyles}
            type={type}
          />
        )}
        {type === "note" && !isSidePanel && (
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              margin: 10,
              zIndex: 10,
            }}
          >
            <SwitchButton
              val={config?.["options.show-local-graph"]?.value}
              update={() =>
                updateConfigField(
                  "options.show-local-graph",
                  !config?.["options.show-local-graph"]?.value
                )
              }
            >
              {(val) => (val ? "Show Full Graph" : "Show Local Graph")}
            </SwitchButton>
          </div>
        )}
        <div
          ref={graphRef}
          style={{
            width: "100%",
            height: "100%",
            zIndex: 1,
            display: showNoteGraphMessage ? "none" : "block",
          }}
        />
      </div>
    </>
  );
}

const NoteGraphMessage = ({
  updateConfigField,
  setIsReady,
  isSidePanel,
}: {
  updateConfigField: (key: string, value: string | number | boolean) => void;
  setIsReady: (isReady: boolean) => void;
  isSidePanel?: boolean;
}) => (
  <Space
    direction="vertical"
    size="large"
    style={{
      zIndex: 10,
      maxWidth: 400,
      padding: "0 2rem",
      textAlign: "center",
      fontSize: "1.2rem",
    }}
  >
    <Typography>
      This is the <b>Local Note Graph.</b> Open a note in the workspace to see
      its connections here.
    </Typography>
    {!isSidePanel && (
      <>
        <Typography>
          Change to <b>Full Note Graph</b> to see all notes in the workspace.
        </Typography>
        <Button
          onClick={() => {
            setIsReady(false);
            // Slight timeout to show loading spinner before re-rendering,
            // as re-rendering is render-blocking
            setTimeout(() => {
              updateConfigField("options.show-local-graph", false);
            }, 50);
          }}
          type="primary"
          size="large"
        >
          Show Full Graph
        </Button>
      </>
    )}
  </Space>
);

const toggleGraphView = (val?: boolean) => {
  const graphType = val ? GraphTypeEnum.fullGraph : GraphTypeEnum.localGraph;
  postVSCodeMessage({
    type: GraphViewMessageEnum.toggleGraphView,
    data: { graphType },
    source: DMessageSource.webClient,
  } as GraphViewMessage);
};

const makePopperWithTippy = (
  node: cytoscape.SingularElementReturnValue,
  id2tooltip: { [key: string]: any }
) => {
  const ref = node.popperRef(); // used only for positioning

  //A dummy element must be passed as tippy only accepts dom element(s) as the target
  const dummyDomEle = document.createElement("div");

  const tooltip = tippy(dummyDomEle, {
    // tippy props:
    getReferenceClientRect: ref.getBoundingClientRect,
    trigger: "manual", // mandatory, we cause the tippy to show programmatically.

    /**
     * your own custom props
     * content prop can be used when the target is a single element
     */
    content: () => {
      const content = document.createElement("div");
      const nodeData = node.data();
      const fname = nodeData["fname"];
      content.innerHTML = fname;
      return content;
    },
  });
  id2tooltip[node.id()] = tooltip;
};
