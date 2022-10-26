import {
  DendronCommandConfig,
  genDefaultCommandConfig,
} from "./commands/commands";
import {
  DendronSeedEntry,
  DendronWorkspaceConfig,
  genDefaultWorkspaceConfig,
  MetadataStoreType,
} from "./workspace/DendronWorkspaceConfig";
import {
  DendronPreviewConfig,
  genDefaultPreviewConfig,
} from "./preview/preview";
import {
  DendronPublishingConfig,
  DuplicateNoteBehavior,
  genDefaultPublishingConfig,
  GoogleAnalyticsConfig,
  HierarchyConfig,
  SearchMode,
  Theme,
} from "./publishing/publishing";
import { DendronGlobalConfig } from "./global/global";
import {
  DendronDevConfig,
  ForceWatcherType,
  genDefaultDevConfig,
} from "./dev/DendronDevConfig";
import {
  CopyNoteLinkConfig,
  InsertNoteIndexConfig,
  InsertNoteLinkConfig,
  LookupConfig,
  RandomNoteConfig,
} from "./commands";
import { DendronWorkspaceEntry } from "../DendronWorkspaceEntry";
import { DVault } from "../DVault";
import { DHookDict } from "../hooks";
import {
  DendronGraphConfig,
  JournalConfig,
  ScratchConfig,
  TaskConfig,
} from "./workspace";
import { VaultSyncMode } from "./base";
import { GiscusConfig, GithubConfig, SEOConfig } from "./publishing";

/**
 * DendronConfig
 * This is the top level config that will hold everything.
 */
export type DendronConfig = {
  version: number;
  global?: DendronGlobalConfig;
  commands: DendronCommandConfig;
  workspace: DendronWorkspaceConfig;
  preview: DendronPreviewConfig;
  publishing: DendronPublishingConfig;
  dev?: DendronDevConfig;
};

export type TopLevelDendronConfig = keyof DendronConfig;

export type DendronConfigValue =
  | string
  | boolean
  | number
  | DendronGlobalConfig
  | DendronCommandConfig
  | LookupConfig
  | RandomNoteConfig
  | InsertNoteLinkConfig
  | InsertNoteIndexConfig
  | CopyNoteLinkConfig
  | DendronWorkspaceConfig
  | { [key: string]: DendronWorkspaceEntry | undefined }
  | { [key: string]: DendronSeedEntry | undefined }
  | DVault[]
  | DHookDict
  | JournalConfig
  | ScratchConfig
  | TaskConfig
  | DendronGraphConfig
  | VaultSyncMode
  | MetadataStoreType
  | DendronPreviewConfig
  | Theme
  | DendronPublishingConfig
  | GoogleAnalyticsConfig
  | { [key: string]: HierarchyConfig }
  | DuplicateNoteBehavior
  | SEOConfig
  | GithubConfig
  | GiscusConfig
  | SearchMode
  | DendronDevConfig
  | ForceWatcherType;

/**
 * Generates a default DendronConfig using
 * respective default config generators of each sub config groups.
 * @returns DendronConfig
 */
export function genDefaultDendronConfig(): DendronConfig {
  return {
    version: 5,
    commands: genDefaultCommandConfig(),
    workspace: genDefaultWorkspaceConfig(),
    preview: genDefaultPreviewConfig(),
    publishing: genDefaultPublishingConfig(),
    dev: genDefaultDevConfig(),
  };
}
