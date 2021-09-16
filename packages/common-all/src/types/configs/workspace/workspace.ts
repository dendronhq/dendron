import { DVault, RemoteEndpoint } from "../../workspace";
import { genDefaultJournalConfig, JournalConfig } from "./journal";
import { genDefaultScratchConfig, ScratchConfig } from "./scratch";
import { genDefaultGraphConfig, DendronGraphConfig } from "../workspace/graph";
import { SeedSite } from "../../seed";
import { DHookDict } from "../../hooks";
import { VaultSyncMode, VaultSyncModeEnum } from "../base";

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
  graph: DendronGraphConfig;
  enableTelemetry: boolean;
  enableAutoCreateOnDefinition: boolean;
  enableXVaultWikiLink: boolean;
  initializeRemoteVaults: boolean;
  workspaceVaultSyncMode: VaultSyncMode;
  enableAutoFoldFrontmatter: boolean;
  // performance related
  maxPreviewsCached: number;
  maxNoteLength: number;
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
    graph: genDefaultGraphConfig(),
    enableTelemetry: true,
    enableAutoCreateOnDefinition: false,
    enableXVaultWikiLink: false,
    initializeRemoteVaults: true,
    workspaceVaultSyncMode: VaultSyncModeEnum.noCommit,
    enableAutoFoldFrontmatter: true,
    maxPreviewsCached: 10,
    maxNoteLength: 204800,
  };
}
