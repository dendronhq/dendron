
// export type StageEnv = {
//   ENGINE_ENDPOINT_PORT?: number;
// };

import { engineSlice, ideSlice } from "@dendronhq/common-frontend";

export enum CONFIG_KEY {
  ENGINE_ENDPOINT_PORT = "ENGINE_ENDPOINT_PORT",
  REMOTE_API_ENDPOINT = "REMOTE_API_ENDPOINT",
}

export type StageEnv = typeof CONFIG_KEY;


export type WorkspaceProps = {
  port: number;
  ws: string;
  theme?: string;
};

export type DendronProps = {
  engine: engineSlice.EngineState,
  ide: ideSlice.IDEState;
};