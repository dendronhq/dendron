import cytoscape from "cytoscape";
import { useEffect, useState } from "react";
import { createLogger } from "@dendronhq/common-frontend";
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
        if (v?.value && includedElements.hasClass("hidden--vault")) {
          includedElements.removeClass("hidden--vault");
        }

        // If elements should not be included
        else if (!v?.value && !includedElements.hasClass("hidden--vault")) {
          includedElements.addClass("hidden--vault");
        }
      });
  };
  const applyFilterRegexConfig = () => {
    if (!graph || graph.$("*").length === 0) return;

    const regexItem = config["filter.regex"];

    // Check if element includes regex
    const matchingElements = graph.$(`[fname *= "${regexItem.value}"]`);
    const excludedElements = graph.$(`[fname !*= "${regexItem.value}"]`);

    logger.log("Matching elements:", matchingElements.length);
    logger.log("Excluded elements:", excludedElements.length);

    // graph.$('*').forEach(element => {
    //   element.data.fname.match(regexItem.value)
    // })

    matchingElements.forEach((element) => {
      if (element.hasClass("hidden--regex")) {
        element.removeClass("hidden--regex");
        // element.edges().removeClass("hidden--regex");
      }
    });

    if (excludedElements.length === 0) {
      graph.$("*").removeClass("hidden--regex");
      return;
    }
    excludedElements.forEach((element) => {
      if (!element.hasClass("hidden--regex")) {
        element.addClass("hidden--regex");
        // element.edges().addClass("hidden--regex");
      }
    });
  };

  const applyConfig = () => {
    if (!graph || graph.$("*").length === 0) return;

    applyDisplayConfig();
    applyVaultConfig();
    applyFilterRegexConfig();

    logger.log(graph.$(".hidden--regex"));

    graph.layout(getEulerConfig(!isLargeGraph)).run();
  };

  useEffect(() => {
    applyConfig();
  }, [config]);
};

export default useApplyGraphConfig;
