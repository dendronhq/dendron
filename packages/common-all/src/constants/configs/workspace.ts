import {
  DendronConfigEntry,
  DendronConfigEntryCollection,
} from "../../types/configs/base";
import { NoteAddBehaviorEnum } from "../../types/configs/workspace/types";
import {
  // dayOfWeekNumber,
  JournalConfig,
} from "../../types/configs/workspace/journal";
import { TaskConfig } from "../../types/configs/workspace/task";
import { DendronWorkspaceConfig } from "../../types/configs/workspace/DendronWorkspaceConfig";
import { DendronGraphConfig } from "../../types/configs/workspace/graph";
import { ScratchConfig } from "../../types/configs/workspace/scratch";
import { VAULT_SYNC_MODES } from "./base";
import { SELECTION_MODES } from "./commands";

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
  createStub: {
    label: "Create Stub",
    desc: "When enabled, create a note if it hasn't been created already when clicked on a graph node",
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

const TASK: DendronConfigEntryCollection<TaskConfig> = {
  name: {
    label: "Task name",
    desc: "Name used for task notes",
  },
  dateFormat: {
    label: "Date Format",
    desc: "Date format used for task notes",
  },
  addBehavior: ADD_BEHAVIOR,
  prioritySymbols: {
    label: "Priority symbols",
    desc: 'Maps symbols in the "priority" frontmatter property to a symbol, word, or sentence. This will be used to display that priority to the users.',
  },
  statusSymbols: {
    label: "Status symbols",
    desc: 'Maps symbols in the "status" frontmatter property to a symbol, word, or sentence. This will be used to display that status to the users.',
  },
  todoIntegration: {
    label: "Todo integration",
    desc: 'Adds a "TODO: ..." property to the frontmatter. This allows easier interoperability with other extensions like Todo Tree.',
  },
  createTaskSelectionType: Object.fromEntries(
    Object.entries(SELECTION_MODES).map(([key, value]) => {
      value.desc = `When using Create Task Note, ${value.desc.toLowerCase()}`;
      return [key, value];
    })
  ),
  taskCompleteStatus: {
    label: "When is a task complete",
    desc: "If the note state is set to any of these values, the note is considered to be done.",
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
  task: TASK,
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
  enableEditorDecorations: {
    label: "Enable Editor Decorations",
    desc: "Enable editor decorations, which highlight wikilinks, add colors for hashtags and more as you write your code.",
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
  enableFullHierarchyNoteTitle: {
    label: "Enable FullHierarchyNoteTitle mode",
    desc: "When enabled, the full hierarchy position of a note is used to generate the note title",
  },
  metadataStore: {
    label: "Storage engine for metadata",
    desc: "values: sqlite|json",
  },
};
