import { DendronComponent } from "../types";
import { getVisualizationContent } from "@dendronhq/dendron-viz";

const Visualization: DendronComponent = (props) => {
  // const {
  //   engine,
  //   workspace: { ws },
  // } = props;
  //TODO: This needs engine and port
  // const visualization = getVisualizationContent({ engine, wsRoot: ws });
  return <h1>Hello</h1>;
};

export default Visualization;
