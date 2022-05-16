import { ideHooks, ideSlice } from "@dendronhq/common-frontend";
import { DendronComponent } from "../types";
import DendronGraphPanel from "./DendronGraphPanel";

/**
 * Wrapper component around DendronGraphPanel
 * @param props
 * @returns DendronGraphPanel component with ide.isSidePanel set to true
 */
const DendronSideGraphPanel: DendronComponent = (props) => {
  const ideDispatch = ideHooks.useIDEAppDispatch();
  // set side panel to true
  ideDispatch(ideSlice.actions.setIsSidePanel(true));
  return <DendronGraphPanel {...props} />;
};
export default DendronSideGraphPanel;
