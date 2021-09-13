import {
  DendronConfigEntry,
  DendronConfigEntryCollection,
} from "../../types/configs/base";
import { NoteAddBehaviorEnum } from "../../types/configs/workspace/types";
import {
  dayOfWeekNumber,
  JournalConfig,
} from "../../types/configs/workspace/journal";
import {
  VaultSyncBehaviorEnum,
  DendronWorkspaceConfig,
} from "../../types/configs/workspace/workspace";
import { DendronGraphConfig } from "../../types/configs/workspace/graph";
import { ScratchConfig } from "../../types/configs/workspace/scratch";

const ADD_BEHAVIOR: Record<NoteAddBehaviorEnum, DendronConfigEntry<string>> = {
  [NoteAddBehaviorEnum.childOfDomain]: {
    value: "childOfDomain",
    label: "Child of Domain",
    desc: "Note is added as the child of domain of the current hierarchy",
  },
  [NoteAddBehaviorEnum.childOfDomainNamespace]: {
    value: "childOfDomainNamespace",
    label: "Child of Domain Namespace",
    desc: "Note is added as child of the namespace of the current domain if it has a namespace. Otherwise added as child of domain.",
  },
  [NoteAddBehaviorEnum.childOfCurrent]: {
    value: "childOfCurrent",
    label: "Child of Current",
    desc: "Note is added as a child of the current open note",
  },
  [NoteAddBehaviorEnum.asOwnDomain]: {
    value: "asOwnDomain",
    label: "as Own Domain",
    desc: "Note is created under the domain specified by journal name value",
  },
};

const GRAPH: DendronConfigEntryCollection<DendronGraphConfig> = {
  zoomSpeed: {
    label: "Zoom Speed",
    desc: "The speed at which the graph zooms in and out. Lower is slower, higher is faster.",
  },
};

/**
 * Given a {@link dayOfWeekNumber}, returns a {@link DendronConfigEntry} that holds
 * user friendly description of the first day of week behavior.
 *
 * @param value {@link dayOfWeekNumber}
 * @returns DendronConfigEntry
 */
const FIRST_DAY_OF_WEEK = (
  value: dayOfWeekNumber
): DendronConfigEntry<dayOfWeekNumber> => {
  const dayOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const valueToDay = dayOfWeek[value];
  return {
    value,
    label: valueToDay,
    desc: `Set start of the week to ${valueToDay}`,
  };
};

const JOURNAL: DendronConfigEntryCollection<JournalConfig> = {
  dailyDomain: {
    label: "Daily Domain",
    desc: "Domain where the journal notes are created",
  },
  dailyVault: {
    label: "Daily Vault",
    desc: "Name of vault where daily journal should be in",
  },
  name: {
    label: "Journal Name",
    desc: "Name used for journal notes",
  },
  dateFormat: {
    label: "Date Format",
    desc: "Date format used for journal notes",
  },
  addBehavior: ADD_BEHAVIOR,
  firstDayOfWeek: FIRST_DAY_OF_WEEK,
};

const SCRATCH: DendronConfigEntryCollection<ScratchConfig> = {
  name: {
    label: "Scratch Name",
    desc: "Name used for scratch notes",
  },
  dateFormat: {
    label: "Date Format",
    desc: "Date format used for scratch notes",
  },
  addBehavior: ADD_BEHAVIOR,
};

const VAULT_SYNC_BEHAVIORS: Record<
  VaultSyncBehaviorEnum,
  DendronConfigEntry<string>
> = {
  [VaultSyncBehaviorEnum.skip]: {
    value: VaultSyncBehaviorEnum.skip,
    label: "Skip",
    desc: "Skip entirely. You must manage the repository manually.",
  },
  [VaultSyncBehaviorEnum.noPush]: {
    value: VaultSyncBehaviorEnum.noPush,
    label: "No Push",
    desc: "Commit any changes and pull updates, but don't push. You can watch the repository and make local changes without sharing them back",
  },
  [VaultSyncBehaviorEnum.noCommit]: {
    value: VaultSyncBehaviorEnum.noCommit,
    label: "No Commit",
    desc: "Pull and push updates if the workspace is clean, but don't commit. You manually commit your local changes, but automatically share them once you committed.",
  },
  [VaultSyncBehaviorEnum.sync]: {
    value: VaultSyncBehaviorEnum.sync,
    label: "Sync",
    desc: "Commit changes, and pull and push updates. Treats workspace vaults like regular vaults.",
  },
};

export const WORKSPACE: DendronConfigEntryCollection<DendronWorkspaceConfig> = {
  dendronVersion: {
    label: "Dendron version",
    desc: "Dendron version. Set up by plugin.",
  },
  workspaces: {
    label: "Workspaces",
    desc: "Workspaces",
  },
  seeds: {
    label: "Seeds",
    desc: "Seeds",
  },
  vaults: {
    label: "Vaults",
    desc: "Vaults",
  },
  hooks: {
    label: "Hooks",
    desc: "Hooks",
  },
  journal: JOURNAL,
  scratch: SCRATCH,
  graph: GRAPH,
  enableTelemetry: {
    label: `Enable Telemetry`,
    desc: `Enable telemetry that collects usage data to help improve Dendron.`,
  },
  enableAutoCreateOnDefinition: {
    label: "Enable auto create on definition",
    desc: "Automatically create note when looking up definition",
  },
  enableXVaultWikiLink: {
    label: "Enable cross-vault wikilink",
    desc: "Enable cross-vault wikilinks",
  },
  initializeRemoteVaults: {
    label: "Initialize Remote Vaults",
    desc: "Initialize remote vaults on startup.",
  },
  workspaceVaultSync: VAULT_SYNC_BEHAVIORS,
  enableAutoFoldFrontmatter: {
    label: "Enable Auto Fold Frontmatter",
    desc: "Enable Automatically folding frontmatter block when opening a new note.",
  },
  enableCaching: {
    label: "Enable Caching",
    desc: "Enable Caching Behavior",
  },
  maxPreviewsCached: {
    label: "Max Preview Cached",
    desc: "Maximum number of rendered previews to cache.",
  },
  maxNoteLength: {
    label: "Max Note Length",
    desc: "Maximum number of characters in a note. Notes with characters exceeding this number will have some Dendron features disabled.",
  },
};
