export type WorkspaceFolderRaw = {
  path: string;
  name?: string;
};

export type WorkspaceSettings = {
  folders: WorkspaceFolderRaw[];
  settings: any;
  extensions: any;
};

export type EngineFlavor = "note" | "schema";
export type EngineOpts = {
  flavor: EngineFlavor;
};
