import { DendronComponent } from "../types";
import { getVisualizationContent } from "@dendronhq/dendron-viz";
import { createLogger, engineHooks } from "@dendronhq/common-frontend";
import { useEffect, useState } from "react";
import { useWorkspaceProps } from "../hooks";

const { useEngine, useConfig } = engineHooks;

const Visualization: DendronComponent = (props) => {
  const { engine } = props;

  const ctx = "DendronNotePreview";
  const logger = createLogger("DendronNotePreview");
  const noteProps = props.ide.noteActive;
  const config = props.engine.config;

  const [workspace] = useWorkspaceProps();
  const { useConfig } = engineHooks;
  useConfig({ opts: workspace });

  //TODO: Figure out how to use logger and what logger is for
  logger.info({
    ctx,
    msg: "enter",
    noteProps: noteProps ? noteProps.id : "no notes found",
    config,
  });

  useEngine({
    engineState: engine,
    opts: { url: workspace.url, ws: workspace.ws },
  });

  // Get current note (and vault), and display the corresponding visualization
  let noteActive = props.ide.noteActive;
  const activeVault = noteActive?.vault;

  console.log("ide", props.ide);
  console.log("noteActive", noteActive?.fname);

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
