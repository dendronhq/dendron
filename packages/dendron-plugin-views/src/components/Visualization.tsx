import { DendronComponent } from "../types";
import { getVisualizationContent } from "@dendronhq/dendron-viz";
import { engineHooks } from "@dendronhq/common-frontend";
import { useEffect, useState } from "react";

const { useEngine } = engineHooks;

const Visualization: DendronComponent = (props) => {
  const { engine, workspace } = props;

  useEngine({
    engineState: engine,
    opts: { url: workspace.url, ws: workspace.ws },
  });

  // Get current note (and vault), and display the corresponding visualization
  let noteActive = props.ide.noteActive;
  const activeVault = noteActive?.vault;

  const [component, setComponent] = useState<JSX.Element | undefined>(
    undefined
  );

  useEffect(() => {
    (async () => {
      if (!activeVault || !engine.wsRoot)
        return setComponent(
          <h1>Please open a note of a vault to visualize</h1>
        );

      const component = await getVisualizationContent({
        notes: engine.notes,
        vault: activeVault,
        wsRoot: engine.wsRoot,
      });

      setComponent(component);
    })();
  }, [activeVault, engine.notes, engine.wsRoot]);

  // //TODO: Replace this with loading fallback UI
  return component ? component : <h1>Loading</h1>;
};

export default Visualization;
