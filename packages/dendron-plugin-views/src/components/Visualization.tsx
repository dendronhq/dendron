import { DendronComponent } from "../types";
import { getVisualizationContent } from "@dendronhq/dendron-viz";
import { engineHooks } from "@dendronhq/common-frontend";

const Visualization: DendronComponent = (props) => {
  const { engine, workspace } = props;

  const { useEngine } = engineHooks;
  useEngine({
    engineState: engine,
    opts: { url: workspace.url, ws: workspace.ws },
  });

  //TODO: Get current note (and vault), and display the corresponding visualization
  let noteActive = props.ide.noteActive;
  const activeVault = noteActive?.vault;

  return activeVault && engine.wsRoot ? (
    getVisualizationContent({
      notes: engine.notes,
      vault: activeVault,
      wsRoot: engine.wsRoot,
    })
  ) : (
    <h1>Open vault</h1>
  );
};

export default Visualization;
