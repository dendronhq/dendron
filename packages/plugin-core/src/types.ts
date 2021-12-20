import { DVault, IntermediateDendronConfig } from "@dendronhq/common-all";
import { IDendronExtension } from "./dendronExtensionInterface";

export type EngineFlavor = "note" | "schema";
export type EngineOpts = {
  flavor: EngineFlavor;
};

export type DateTimeFormat =
  | "DATETIME_FULL"
  | "DATETIME_FULL_WITH_SECONDS"
  | "DATETIME_HUGE"
  | "DATETIME_HUGE_WITH_SECONDS"
  | "DATETIME_MED"
  | "DATETIME_MED_WITH_SECONDS"
  | "DATETIME_SHORT"
  | "DATETIME_SHORT_WITH_SECONDS"
  | "DATE_FULL"
  | "DATE_HUGE"
  | "DATE_MED"
  | "DATE_MED_WITH_WEEKDAY"
  | "DATE_SHORT"
  | "TIME_24_SIMPLE"
  | "TIME_24_WITH_LONG_OFFSET"
  | "TIME_24_WITH_SECONDS"
  | "TIME_24_WITH_SHORT_OFFSET"
  | "TIME_SIMPLE"
  | "TIME_WITH_LONG_OFFSET"
  | "TIME_WITH_SECONDS"
  | "TIME_WITH_SHORT_OFFSET";

export enum CodeConfigKeys {
  DEFAULT_TIMESTAMP_DECORATION_FORMAT = "dendron.defaultTimestampDecorationFormat",
}

export type DendronWorkspaceSettings = Partial<{
  "dendron.dailyJournalDomain": string;
  "dendron.defaultJournalName": string;
  "dendron.defaultJournalDateFormat": string;
  "dendron.defaultJournalAddBehavior": string;
  "dendron.defaultScratchName": string;
  "dendron.defaultScratchDateFormat": string;
  "dendron.defaultScratchAddBehavior": string;
  "dendron.copyNoteUrlRoot": string;
  "dendron.linkSelectAutoTitleBehavior": string;
  "dendron.defaultLookupCreateBehavior": string;
  "dendron.defaultTimestampDecorationFormat": string;
  "dendron.rootDir": string;
  "dendron.dendronDir": string;
  "dendron.logLevel": string;
  "dendron.trace.server": string;
  "dendron.serverPort": string;
}>;

export type WorkspaceOptsV2 = {
  wsRoot: string;
  vaults: DVault[];
  extension: IDendronExtension;
  dendronConfig?: IntermediateDendronConfig;
};
