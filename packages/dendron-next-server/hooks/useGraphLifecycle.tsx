import cytoscape from "cytoscape";
import { useEffect, useState } from "react";



export default function useGraphLifecycle(graph: cytoscape.Core | undefined) {
  const [isReady, setIsReady] = useState(false);
  const [isLayoutComplete, setIsLayoutComplete] = useState(false);

  useEffect(() => {
    if (graph) {
      graph.on("ready", () => setIsReady(true));
      graph.on("layoutstop", () => setIsLayoutComplete(true));
    }
  }, [graph]);

  return {
    isReady,
    isLayoutComplete,
  }
}