import { DVault, RemoteEndpoint } from "../../workspace";
import { genDefaultJournalConfig, JournalConfig } from "./journal";
import { genDefaultScratchConfig, ScratchConfig } from "./scratch";
import { genDefaultGraphConfig, DendronGraphConfig } from "../workspace/graph";
import { SeedSite } from "../../seed";
import { DHookDict } from "../../hooks";

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
  workspaceVaultSync: VaultSyncBehavior;
  enableAutoFoldFrontmatter: boolean;
  // performance related
  enableCaching: boolean;
  maxPreviewsCached: number;
  maxNoteLength: number;
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

export enum VaultSyncBehaviorEnum {
  skip = "skip",
  noPush = "noPush",
  noCommit = "noCommit",
  sync = "sync",
}

export type VaultSyncBehavior = keyof typeof VaultSyncBehaviorEnum;

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
    workspaceVaultSync: VaultSyncBehaviorEnum.sync,
    enableAutoFoldFrontmatter: false,
    enableCaching: true,
    maxPreviewsCached: 10,
    maxNoteLength: 204800,
  };
}
