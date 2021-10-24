import {
  DendronConfigEntry,
  DendronConfigEntryCollection,
} from "../../types/configs/base";
import { NoteAddBehaviorEnum } from "../../types/configs/workspace/types";
import {
  // dayOfWeekNumber,
  JournalConfig,
} from "../../types/configs/workspace/journal";
import { DendronWorkspaceConfig } from "../../types/configs/workspace/workspace";
import { DendronGraphConfig } from "../../types/configs/workspace/graph";
import { ScratchConfig } from "../../types/configs/workspace/scratch";
import { VAULT_SYNC_MODES } from "./base";

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
// const FIRST_DAY_OF_WEEK = (
//   value: dayOfWeekNumber
// ): DendronConfigEntry<dayOfWeekNumber> => {
//   const dayOfWeek = [
//     "Sunday",
//     "Monday",
//     "Tuesday",
//     "Wednesday",
//     "Thursday",
//     "Friday",
//     "Saturday",
//   ];
//   const valueToDay = dayOfWeek[value];
//   return {
//     value,
//     label: valueToDay,
//     desc: `Set start of the week to ${valueToDay}`,
//   };
// };

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
  // firstDayOfWeek: FIRST_DAY_OF_WEEK,
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
  disableTelemetry: {
    label: `Disable Telemetry`,
    desc: `Disable telemetry that collects usage data to help improve Dendron.`,
  },
  enableAutoCreateOnDefinition: {
    label: "Enable auto create on definition",
    desc: "Automatically create note when looking up definition",
  },
  enableXVaultWikiLink: {
    label: "Enable cross-vault wikilink",
    desc: "Enable cross-vault wikilinks",
  },
  enableRemoteVaultInit: {
    label: "Enable Remote Vault Init",
    desc: "Enable initializing remote vaults on startup.",
  },
  workspaceVaultSyncMode: VAULT_SYNC_MODES,
  enableAutoFoldFrontmatter: {
    label: "Enable Auto Fold Frontmatter",
    desc: "Enable Automatically folding frontmatter block when opening a new note.",
  },
  maxPreviewsCached: {
    label: "Max Preview Cached",
    desc: "Maximum number of rendered previews to cache.",
  },
  maxNoteLength: {
    label: "Max Note Length",
    desc: "Maximum number of characters in a note. Notes with characters exceeding this number will have some Dendron features disabled.",
  },
  feedback: {
    label: "Feedback",
    desc: "Enable feedback widget.",
  },
  apiEndpoint: {
    label: "API Endpoint",
    desc: "Endpoint for backend API functionality.",
  },
  enableUserTags: {
    label: "Enable user tags",
    desc: "Enable user tags, which allows @name to link to the note user.name",
  },
  enableHashTags: {
    label: "Enable hashtags",
    desc: "Enable hashtags, which allows #word to link to the note tags.word",
  },
};
