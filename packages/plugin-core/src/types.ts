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

export enum CodeConfigKeys {
  DEFAULT_JOURNAL_NAME = "dendron.defaultJournalName",
  DEFAULT_JOURNAL_DATE_FORMAT = "dendron.defaultJournalDateFormat",
  DEFAULT_TIMESTAMP_DECORATION_FORMAT = "dendron.defaultTimestampDecorationFormat",
}
