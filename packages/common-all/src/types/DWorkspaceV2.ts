import { URI } from "vscode-uri";
import { DEngineClient } from "./typesv2";
import { DVault } from "./DVault";
import { DendronConfig } from "./configs";

export enum WorkspaceType {
  NATIVE = "NATIVE",
  CODE = "CODE",
  NONE = "NONE",
}

export type DWorkspaceV2 = {
  /**
   * Absolute path to the workspace directory
   */
  wsRoot: string;
  type: WorkspaceType;
  config: PromiseLike<DendronConfig>;
  vaults: PromiseLike<DVault[]>;
  engine: DEngineClient;
  /**
   * Where are assets stored (eg. tutorial workspace)
   */
  assetUri: URI;
  /**
   * Log storage
   */
  logUri: URI;
};

/**
 * Extension Install Status
 */
export enum InstallStatus {
  NO_CHANGE = "NO_CHANGE",
  INITIAL_INSTALL = "INITIAL_INSTALL",
  UPGRADED = "UPGRADED",
}
