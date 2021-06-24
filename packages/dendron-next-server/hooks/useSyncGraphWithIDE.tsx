import cytoscape from "cytoscape";
import { useEffect } from "react";
import { createLogger } from "../../common-frontend/lib";
import { EngineSliceUtils } from "../../common-frontend/lib/features/engine/slice";
import { DendronProps } from "../lib/types";

type Props = DendronProps & {
  graph: cytoscape.Core | undefined;
};

const useSyncGraphWithIDE = ({ graph, ide, engine }: Props) => {
  const { noteActive } = ide;
  const engineInitialized = EngineSliceUtils.hasInitialized(engine);

  const logger = createLogger("useSyncGraphWithIDE");

  useEffect(() => {
    if (noteActive && engineInitialized && graph) {
      const selected = graph.$(`[id = "${noteActive.id}"], :selected`);

      logger.log("selected but not active:", selected.length);

      if (selected.length > 0) {
        selected.forEach((node) => {
          // Select active note
          if (node.data("id") === noteActive.id) {
            node.select();
            graph.center(node);
            graph.zoom({
              level: 1.5, // the zoom level
              renderedPosition: node.position(),
            });
          }

          // Unselect not active notes
          else node.unselect();
        });
      }
    }
  }, [noteActive?.id, engineInitialized]);
};

export default useSyncGraphWithIDE;
