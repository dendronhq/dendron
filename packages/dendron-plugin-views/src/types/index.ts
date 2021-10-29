
import { engineSlice, ideSlice } from "@dendronhq/common-frontend";

export type WorkspaceProps = {
  port: number;
  ws: string;
  theme?: string;
  /**
   * workspace loaded through browser
   */
  browser?: boolean;
};

export type DendronComponent = React.FunctionComponent<DendronProps>;

export type DendronProps = {
  engine: engineSlice.EngineState,
  ide: ideSlice.IDEState;
  workspace: WorkspaceProps;
};