import cytoscape from "cytoscape";
import { useEffect } from "react";
import { createLogger } from "@dendronhq/common-frontend";
import { getEulerConfig } from "../components/graph";
import { GraphConfig, GraphElements } from "../lib/graph";
import _ from "lodash";

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
            layoutGraph();
          }
        }

        // If edges should not be included
        else {
          // If these edges are rendered, remove them
          if (edgeCount > 0) {
            includedEdges.remove();
            layoutGraph();
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

        // If elements should be included
        if (v?.value && includedElements.hasClass("hidden--vault")) {
          includedElements.removeClass("hidden--vault");
          layoutGraph();
        }

        // If elements should not be included
        else if (!v?.value && !includedElements.hasClass("hidden--vault")) {
          includedElements.addClass("hidden--vault");
          layoutGraph();
        }
      });
  };
  const applyFilterRegexConfig = () => {
    if (!graph || graph.$("*").length === 0) return;

    const regexTypes: ("whitelist" | "blacklist")[] = [
      "whitelist",
      "blacklist",
    ];

    // Process the whitelist and blacklist inputs
    regexTypes.forEach((type) => {
      const classNameHidden = `hidden--regex-${type}`;
      const regexItem =
        config[
          `filter.regex-${type}` as
            | "filter.regex-whitelist"
            | "filter.regex-blacklist"
        ];

      // Accept comma-separated or space-separated lists
      const regexItemInputs = regexItem.value.split(/(,| )/);

      // Form cytoscape selectors from input
      const matchingInput = regexItemInputs.reduce((acc, input, i) => {
        const prefix = i === 0 ? "" : ", ";
        const trimmedInput = input.trim();
        if (trimmedInput === "") return acc;

        return (acc += `${prefix}[fname *= "${trimmedInput}"], [vault *= "${trimmedInput}"], [label *= "${trimmedInput}"]`);
      }, "");

      const excludedInput = regexItemInputs.reduce((acc, input, i) => {
        const trimmedInput = input.trim();
        if (trimmedInput === "") return acc;

        return (acc += `[fname !*= "${trimmedInput}"][vault !*= "${trimmedInput}"][label !*= "${trimmedInput}"]`);
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
        if (type === "whitelist") showElement(element);
        if (type === "blacklist") hideElement(element);
      });

      // If no input,
      if (
        regexItem.value === "" ||
        (type === "whitelist" && excludedElements.length === 0) ||
        (type === "blacklist" && matchingElements.length === 0)
      ) {
        graph.$("*").removeClass(classNameHidden);
        updatedConfig = true;
        return;
      }

      excludedElements.forEach((element) => {
        if (type === "whitelist") hideElement(element);
        if (type === "blacklist") showElement(element);
      });

      if (updatedConfig) layoutGraph();
    });
  };
  const applyFilterStubsConfig = () => {
    if (!graph || graph.$("*").length === 0) return;
    if (_.isUndefined(config["filter.show-stubs"])) return;

    const configItem = config["filter.show-stubs"];

    const stubElements = graph.$("[?stub]");

    // If should show stubs
    if (configItem.value) {
      if (stubElements.hasClass(".hidden--stub")) {
        stubElements.removeClass("hidden--stub");
        layoutGraph();
      }
    } else {
      if (!stubElements.hasClass(".hidden--stub")) {
        stubElements.addClass("hidden--stub");
        layoutGraph();
      }
    }
  };

  const applyConfig = () => {
    if (!graph || graph.$("*").length === 0) return;

    applyDisplayConfig();
    applyVaultConfig();
    applyFilterRegexConfig();
    applyFilterStubsConfig();
  };

  const layoutGraph = () => {
    if (graph) graph.layout(getEulerConfig(!isLargeGraph)).run();
  };

  useEffect(() => {
    applyConfig();
  }, [config]);
};

export default useApplyGraphConfig;
