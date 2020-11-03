import { WorkspaceFolder } from "vscode";

export type WorkspaceSettings = {
  folders: WorkspaceFolder[];
  settings: any;
  extensions: any;
};

export type EngineFlavor = "note" | "schema";
export type EngineOpts = {
  flavor: EngineFlavor;
};
