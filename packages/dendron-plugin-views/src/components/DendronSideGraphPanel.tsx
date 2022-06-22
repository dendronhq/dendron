import { DendronComponent } from "../types";
import DendronGraphPanel from "./DendronGraphPanel";

/**
 * Wrapper component around DendronGraphPanel
 * @param props
 * @returns DendronGraphPanel component with ide.isSidePanel set to true
 */
const DendronSideGraphPanel: DendronComponent = (props) => {
  props = {
    ...props,
    isSidePanel: true,
  };
  return <DendronGraphPanel {...props} />;
};
export default DendronSideGraphPanel;
