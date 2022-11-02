import cytoscape from "cytoscape";
import { useEffect, useState } from "react";
import { getEulerConfig, GraphUtils } from "../components/graph";
import { GraphConfig, GraphElements } from "../utils/graph";
import _ from "lodash";
import { createLogger } from "@dendronhq/common-frontend";

const useApplyGraphConfig = ({
  graph,
  config,
  elements,
}: {
  graph: cytoscape.Core | undefined;
  config: GraphConfig;
  elements: GraphElements;
}) => {
  const logger = createLogger("useApplyGraphConfig");
  const { nodes, edges } = elements;
  const isLargeGraph = nodes.length + Object.values(edges).flat().length > 1000;
  const [wasLocalGraph, setWasLocalGraph] = useState(false);

  const applyDisplayConfig = (allowRelayout: boolean) => {
    if (!graph || graph.$("*").length === 0) return;

    const isLocalGraph = GraphUtils.isLocalGraph(config);

    // Prevent errors from quick re-renders when switching between local and full graphs
    if (isLocalGraph !== wasLocalGraph) {
      setWasLocalGraph(isLocalGraph);
      return;
    }
    try {
      Object.entries(config)
        .filter(([k, v]) => k.includes("connections"))
        .forEach(([k, v]) => {
          const keyArray = k.split(".");
          const edgeType = keyArray[keyArray.length - 1];

          const includedEdges = graph.$(`.${edgeType}`);
          const edgeCount = includedEdges.length;

          if (!v) return;

          // If edges should be included
          if (v.value) {
            // If these edges aren't rendered, add them
            if (edgeCount === 0) {
              graph.add(edges[edgeType]);
              if (allowRelayout) layoutGraph();
            }
          }

          // If edges should not be included
          // If these edges are rendered, remove them
          else if (edgeCount > 0) {
            includedEdges.remove();
            if (allowRelayout) layoutGraph();
          }
        });
    } catch (err) {
      logger.error(`Couldn't find the edge for target note ${err}`);
    }
  };
  const applyVaultConfig = (allowRelayout: boolean) => {
    if (!graph || graph.$("*").length === 0) return;

    Object.entries(config)
      .filter(([k, v]) => k.includes("vault"))
      .forEach(([k, v]) => {
        const keyArray = k.split(".");
        const vaultName = keyArray[keyArray.length - 1];
        const vaultClass = `vault-${vaultName}`;

        const includedElements = graph.$(`.${vaultClass}`);

        // If elements should be included
        if (v?.value && includedElements.hasClass("hidden--vault")) {
          includedElements.removeClass("hidden--vault");
          if (allowRelayout) layoutGraph();
        }

        // If elements should not be included
        else if (!v?.value && !includedElements.hasClass("hidden--vault")) {
          includedElements.addClass("hidden--vault");
          if (allowRelayout) layoutGraph();
        }
      });
  };
  const applyFilterRegexConfig = (allowRelayout: boolean) => {
    if (!graph || graph.$("*").length === 0) return;

    const regexTypes: ("allowlist" | "blocklist")[] = [
      "allowlist",
      "blocklist",
    ];

    // Process the allowlist and blocklist inputs
    regexTypes.forEach((type) => {
      const classNameHidden = `hidden--regex-${type}`;
      const regexItem =
        config[
          `filter.regex-${type}` as
            | "filter.regex-allowlist"
            | "filter.regex-blocklist"
        ];

      // Accept comma-separated or space-separated lists
      const regexItemInputs = regexItem.value.split(/(,| )/);

      // Form cytoscape selectors from input
      const matchingInput = regexItemInputs.reduce((acc, input, i) => {
        const prefix = i === 0 ? "" : ", ";
        const trimmedInput = input.trim();
        if (trimmedInput === "") return acc;

        acc += `${prefix}[fname *= "${trimmedInput}"], [vault *= "${trimmedInput}"], [label *= "${trimmedInput}"]`;
        return acc;
      }, "");

      const excludedInput = regexItemInputs.reduce((acc, input, i) => {
        const trimmedInput = input.trim();
        if (trimmedInput === "") return acc;

        acc += `[fname !*= "${trimmedInput}"][vault !*= "${trimmedInput}"][label !*= "${trimmedInput}"]`;
        return acc;
      }, "");

      const matchingElements = graph.$(matchingInput);
      const excludedElements = graph.$(excludedInput);

      let updatedConfig = false;

      const hideElement = (element: cytoscape.SingularElementReturnValue) => {
        if (!element.hasClass(classNameHidden)) {
          element.addClass(classNameHidden);
          updatedConfig = true;
        }
      };
      const showElement = (element: cytoscape.SingularElementReturnValue) => {
        if (element.hasClass(classNameHidden)) {
          element.removeClass(classNameHidden);
          updatedConfig = true;
        }
      };

      matchingElements.forEach((element) => {
        if (type === "allowlist") showElement(element);
        if (type === "blocklist") hideElement(element);
      });

      // If no input,
      if (
        regexItem.value === "" ||
        (type === "allowlist" && excludedElements.length === 0) ||
        (type === "blocklist" && matchingElements.length === 0)
      ) {
        graph.$("*").removeClass(classNameHidden);
        updatedConfig = true;
        return;
      }

      excludedElements.forEach((element) => {
        if (type === "allowlist") hideElement(element);
        if (type === "blocklist") showElement(element);
      });

      if (updatedConfig && allowRelayout) layoutGraph();
    });
  };
  const applyFilterStubsConfig = (allowRelayout: boolean) => {
    if (!graph || graph.$("*").length === 0) return;
    if (_.isUndefined(config["filter.show-stubs"])) return;

    const configItem = config["filter.show-stubs"];

    const stubElements = graph.$("[?stub]");

    // If should show stubs
    if (configItem.value) {
      if (stubElements.hasClass("hidden--stub")) {
        stubElements.removeClass("hidden--stub");
        if (allowRelayout) layoutGraph();
      }
    } else if (!stubElements.hasClass("hidden--stub")) {
      stubElements.addClass("hidden--stub");
      if (allowRelayout) layoutGraph();
    }
  };
  const applyFilterOptionsConfig = () => {
    if (_.isUndefined(graph)) return;
    if (!config["options.show-labels"].value) {
      graph.$("node").addClass("hidden--labels");
    } else {
      graph.$("node").removeClass("hidden--labels");
    }
  };

  const applyConfig = () => {
    if (!graph || graph.$("*").length === 0) return;

    const allowRelayout = config["options.allow-relayout"].value;

    applyDisplayConfig(allowRelayout);
    applyVaultConfig(allowRelayout);
    applyFilterRegexConfig(allowRelayout);
    applyFilterStubsConfig(allowRelayout);
    applyFilterOptionsConfig();
  };

  const layoutGraph = () => {
    if (graph) graph.layout(getEulerConfig(!isLargeGraph)).run();
  };

  useEffect(() => {
    applyConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);
};

export default useApplyGraphConfig;
