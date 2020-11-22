export type WorkspaceFolderRaw = {
  path: string;
  name?: string;
};

export type WorkspaceExtensionSetting = {
  recommendations: string[];
  unwantedRecommendations: string[];
};
export type WorkspaceSettings = {
  folders: WorkspaceFolderRaw[];
  settings: any;
  extensions: WorkspaceExtensionSetting;
};

export type EngineFlavor = "note" | "schema";
export type EngineOpts = {
  flavor: EngineFlavor;
};
