import { DVault, RemoteEndpoint } from "../../workspace";
import { genDefaultJournalConfig, JournalConfig } from "./journal";
import { genDefaultScratchConfig, ScratchConfig } from "./scratch";
import { genDefaultGraphConfig, DendronGraphConfig } from "../workspace/graph";
import { SeedSite } from "../../seed";
import { DHookDict } from "../../hooks";
import { VaultSyncMode, VaultSyncModeEnum } from "../base";
import { genDefaultTaskConfig, TaskConfig } from "./task";
import { DendronViewsConfig, genDefaultDendronViewsConfig } from "./views";

/**
 * Namespace for configurations that affect the workspace
 */
export type DendronWorkspaceConfig = {
  // general
  dendronVersion?: string;
  workspaces?: { [key: string]: DendronWorkspaceEntry | undefined };
  seeds?: { [key: string]: DendronSeedEntry | undefined };
  vaults: DVault[];
  hooks?: DHookDict;
  // features
  journal: JournalConfig;
  scratch: ScratchConfig;
  task: TaskConfig;
  graph: DendronGraphConfig;
  views: DendronViewsConfig;
  disableTelemetry?: boolean;
  enableAutoCreateOnDefinition: boolean;
  enableXVaultWikiLink: boolean;
  enableRemoteVaultInit: boolean;
  workspaceVaultSyncMode: VaultSyncMode;
  enableAutoFoldFrontmatter: boolean;
  enableUserTags: boolean;
  enableHashTags: boolean;
  enableFullHierarchyNoteTitle: boolean;
  // performance related
  maxPreviewsCached: number;
  maxNoteLength: number;
  enableEditorDecorations: boolean;
  //
  feedback?: boolean;
  apiEndpoint?: string;
};

export type DendronWorkspace = {
  name: string;
  vaults: DVault[];
  remote: RemoteEndpoint;
};

export type DendronWorkspaceEntry = Omit<DendronWorkspace, "name" | "vaults">;

export type DendronSeedEntry = {
  branch?: string;
  site?: SeedSite;
};

/**
 * Generates default {@link DendronWorkspaceConfig}
 * @returns DendronWorkspaceConfig
 */
export function genDefaultWorkspaceConfig(): DendronWorkspaceConfig {
  return {
    vaults: [],
    journal: genDefaultJournalConfig(),
    scratch: genDefaultScratchConfig(),
    task: genDefaultTaskConfig(),
    graph: genDefaultGraphConfig(),
    views: genDefaultDendronViewsConfig(),
    enableAutoCreateOnDefinition: false,
    enableXVaultWikiLink: false,
    enableRemoteVaultInit: true,
    enableUserTags: true,
    enableHashTags: true,
    workspaceVaultSyncMode: VaultSyncModeEnum.noCommit,
    enableAutoFoldFrontmatter: false,
    enableEditorDecorations: true,
    maxPreviewsCached: 10,
    maxNoteLength: 204800,
    enableFullHierarchyNoteTitle: false,
  };
}
