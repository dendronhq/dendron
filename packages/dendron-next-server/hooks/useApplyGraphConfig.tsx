import cytoscape from "cytoscape";
import { useEffect, useState } from "react";
import { createLogger } from "../../common-frontend/lib";
import { getEulerConfig } from "../components/graph";
import { GraphConfig, GraphElements } from "../lib/graph";

const useApplyGraphConfig = ({
  graph,
  config,
  elements,
}: {
  graph: cytoscape.Core | undefined;
  config: GraphConfig;
  elements: GraphElements;
}) => {
  const logger = createLogger("Graph: useApplyGraphConfig");
  const { nodes, edges } = elements;
  const isLargeGraph = nodes.length + Object.values(edges).flat().length > 1000;

  const applyDisplayConfig = () => {
    if (!graph || graph.$("*").length === 0) return;

    Object.entries(config)
      .filter(([k, v]) => k.includes("connections"))
      .forEach(([k, v]) => {
        const keyArray = k.split(".");
        const edgeType = keyArray[keyArray.length - 1];

        const includedEdges = graph.$(`.${edgeType}`);
        const edgeCount = includedEdges.length;

        // If edges should be included
        if (v?.value) {
          // If these edges aren't rendered, add them
          if (edgeCount === 0) {
            graph.add(edges[edgeType]);
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
  };
  const applyVaultConfig = () => {
    if (!graph || graph.$("*").length === 0) return;

    Object.entries(config)
      .filter(([k, v]) => k.includes("vault"))
      .forEach(([k, v]) => {
        const keyArray = k.split(".");
        const vaultName = keyArray[keyArray.length - 1];
        const vaultClass = `vault-${vaultName}`;

        const includedElements = graph.$(`.${vaultClass}`);
        const elementCount = includedElements.length;

        // If elements should be included
        if (v?.value && includedElements.hasClass("hidden")) {
          includedElements.removeClass("hidden");
        }

        // If elements should not be included
        else if (!v?.value && !includedElements.hasClass("hidden")) {
          includedElements.addClass("hidden");
        }
      });
  };

  const applyConfig = () => {
    if (!graph || graph.$("*").length === 0) return;

    applyDisplayConfig();
    applyVaultConfig();

    graph.layout(getEulerConfig(!isLargeGraph)).run();
  };

  useEffect(() => {
    applyConfig();
  }, [config]);
};

export default useApplyGraphConfig;
