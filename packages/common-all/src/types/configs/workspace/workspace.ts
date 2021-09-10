import { DendronConfigEntry, DendronConfigEntryCollection } from "../base";
import { DVault, RemoteEndpoint } from "../../workspace";
import { genDefaultJournalConfig, JournalConfig, JOURNAL } from "./journal";
import { genDefaultScratcnConfig, ScratchConfig, SCRATCH } from "./scratch";
import {
  genDefaultGraphConfig,
  DendronGraphConfig,
  GRAPH,
} from "../workspace/graph";
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
  noTelemetry: boolean;
  noAutoCreateOnDefinition: boolean;
  noXVaultWikiLink: boolean;
  initializeRemoteVaults: boolean;
  workspaceVaultSync: VaultSyncBehavior;
  autoFoldFrontmatter: boolean;
  // performance related
  noCaching?: boolean;
  maxPreviewsCached?: number;
  maxNoteLength?: number;
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

const VAULT_SYNC_BEHAVIORS: {
  [key in VaultSyncBehavior]: DendronConfigEntry<string>;
} = {
  skip: {
    value: VaultSyncBehaviorEnum.skip,
    label: "skip",
    desc: "Skip entirely. You must manage the repository manually.",
  },
  noPush: {
    value: VaultSyncBehaviorEnum.noPush,
    label: "no push",
    desc: "Commit any changes and pull updates, but don't push. You can watch the repository and make local changes without sharing them back",
  },
  noCommit: {
    value: VaultSyncBehaviorEnum.noCommit,
    label: "no commit",
    desc: "Pull and push updates if the workspace is clean, but don't commit. You manually commit your local changes, but automatically share them once you committed.",
  },
  sync: {
    value: VaultSyncBehaviorEnum.sync,
    label: "sync",
    desc: "Commit changes, and pull and push updates. Treats workspace vaults like regular vaults.",
  },
};

/**
 * Given a boolean value, returns a {@link DendronConfigEntry} that holds
 * user friendly description of the noTelemetry configuration.
 *
 * @param value booelan
 * @returns DendronConfigEntry
 */
export const NO_TELEMETRY = (value: boolean): DendronConfigEntry<boolean> => {
  const valueToString = value ? "Disable" : "Enable";
  return {
    label: `${valueToString} telemetry`,
    desc: `${valueToString} telemetry that collects usage data to help improve Dendron.`,
  };
};

/**
 * Constants holding all workspace config related {@link DendronConfigEntry}
 */
export const WORKSPACE: DendronConfigEntryCollection<DendronWorkspaceConfig> = {
  dendronVersion: {
    label: "dendron version",
    desc: "Dendron version. Set up by plugin.",
  },
  workspaces: {
    label: "workspaces",
    desc: "Workspaces",
  },
  seeds: {
    label: "seeds",
    desc: "Seeds",
  },
  vaults: {
    label: "vaults",
    desc: "Vaults",
  },
  hooks: {
    label: "hooks",
    desc: "Hooks",
  },
  journal: JOURNAL,
  scratch: SCRATCH,
  graph: GRAPH,
  noTelemetry: NO_TELEMETRY,
  noAutoCreateOnDefinition: {
    label: "no auto create on definition",
    desc: "Don't automatically create note when looking up definition",
  },
  noXVaultWikiLink: {
    label: "no cross-vault wikilink",
    desc: "Disable cross-vault wikilinks",
  },
  initializeRemoteVaults: {
    label: "initialize remote vaults",
    desc: "Initialize remote vaults on startup.",
  },
  workspaceVaultSync: VAULT_SYNC_BEHAVIORS,
  autoFoldFrontmatter: {
    label: "auto-fold frontmatter",
    desc: "Automatically fold frontmatter block when opening a new note.",
  },
  noCaching: {
    label: "no caching",
    desc: "Disable caching behavior",
  },
  maxPreviewsCached: {
    label: "max preview cached",
    desc: "Maximum number of rendered previews to cache.",
  },
  maxNoteLength: {
    lable: "max note length",
    desc: "Maximum number of characters in a note. Notes with characters exceeding this number will have some Dendron features disabled.",
  },
};

export function genDefaultWorkspaceConfig(): DendronWorkspaceConfig {
  return {
    vaults: [],
    journal: genDefaultJournalConfig(),
    scratch: genDefaultScratcnConfig(),
    graph: genDefaultGraphConfig(),
    noTelemetry: false,
    noAutoCreateOnDefinition: true,
    noXVaultWikiLink: true,
    initializeRemoteVaults: true,
    workspaceVaultSync: VaultSyncBehaviorEnum.sync,
    autoFoldFrontmatter: false,
    noCaching: false,
    maxPreviewsCached: 10,
    maxNoteLength: 204800,
  };
}
