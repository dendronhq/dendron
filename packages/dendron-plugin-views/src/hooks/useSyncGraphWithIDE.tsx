/* eslint-disable react-hooks/exhaustive-deps */
import { createLogger, engineSliceUtils } from "@dendronhq/common-frontend";
import cytoscape from "cytoscape";
import { useEffect, useState } from "react";
import { GraphUtils } from "../components/graph";
import { GraphConfig } from "../utils/graph";
import { DendronProps } from "../types";

type Props = DendronProps & {
  graph: cytoscape.Core | undefined;
  config: GraphConfig;
};

const useSyncGraphWithIDE = ({ graph, ide, engine, config }: Props) => {
  const [lastSelectedID, setLastSelectedID] = useState("");

  const { noteActive } = ide;
  const engineInitialized = engineSliceUtils.hasInitialized(engine);

  const logger = createLogger("useSyncGraphWithIDE");

  useEffect(() => {
    if (
      noteActive &&
      engineInitialized &&
      graph &&
      !GraphUtils.isLocalGraph(config)
    ) {
      const selected = graph.$(`:selected`);
      const graphActiveNode = graph.$(`[id = "${noteActive.id}"]`);

      logger.log("noteActive", noteActive.fname);

      if (selected.length > 0) {
        selected.forEach((node) => {
          // Unselect not active notes
          if (node.data("id") !== noteActive.id) {
            node.unselect();
          }
        });
      }

      // Select active note
      if (
        graphActiveNode.length > 0 &&
        graphActiveNode.id() !== lastSelectedID
      ) {
        graphActiveNode.select();
        graph.center(graphActiveNode);
        graph.zoom({
          level: 1.5, // the zoom level
          position: graphActiveNode.position(),
        });
        setLastSelectedID(graphActiveNode.id());
      }
    }
  }, [noteActive?.id, engineInitialized, config["options.show-local-graph"]]);
};

export default useSyncGraphWithIDE;
