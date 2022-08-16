import { ErrorFactory } from "..";

export type DendronWebViewEntry = {
  label: string;
  desc: string;
  bundleName: string;
  type: "webview";
};
export type DendronNativeViewEntry = {
  label: string;
  desc: string;
  type: "nativeview";
};

export type DendronViewEntry = DendronWebViewEntry | DendronNativeViewEntry;

export enum DendronEditorViewKey {
  CONFIGURE = "dendron.configure",
  NOTE_GRAPH = "dendron.graph-note",
  SCHEMA_GRAPH = "dendron.graph-schema",
  NOTE_PREVIEW = "dendron.note-preview",
  SEED_BROWSER = "dendron.seed-browser",
}

export enum DendronTreeViewKey {
  SAMPLE_VIEW = "dendron.sample",
  TREE_VIEW = "dendron.treeView",
  BACKLINKS = "dendron.backlinks",
  CALENDAR_VIEW = "dendron.calendar-view",
  LOOKUP_VIEW = "dendron.lookup-view",
  TIP_OF_THE_DAY = "dendron.tip-of-the-day",
  HELP_AND_FEEDBACK = "dendron.help-and-feedback",
  GRAPH_PANEL = "dendron.graph-panel",
  RECENT_WORKSPACES = "dendron.recent-workspaces",
}

export const EDITOR_VIEWS: Record<DendronEditorViewKey, DendronViewEntry> = {
  [DendronEditorViewKey.NOTE_PREVIEW]: {
    desc: "Note Preview",
    label: "Note Preview",
    bundleName: "DendronNotePreview",
    type: "webview",
  },
  [DendronEditorViewKey.CONFIGURE]: {
    desc: "Dendron Configuration",
    label: "Dendron Configuration",
    bundleName: "DendronConfigure",
    type: "webview",
  },
  [DendronEditorViewKey.NOTE_GRAPH]: {
    desc: "Note Graph",
    label: "Note Graph",
    bundleName: "DendronGraphPanel",
    type: "webview",
  },
  [DendronEditorViewKey.SCHEMA_GRAPH]: {
    desc: "Schema Graph",
    label: "Schema Graph",
    bundleName: "DendronSchemaGraphPanel",
    type: "webview",
  },
  [DendronEditorViewKey.SEED_BROWSER]: {
    desc: "Seed Registry",
    label: "Seed Registry",
    bundleName: "SeedBrowser",
    type: "webview",
  },
};

/**
 * Value is the name of webpack bundle for webview based tree views
 */
export const TREE_VIEWS: Record<DendronTreeViewKey, DendronViewEntry> = {
  [DendronTreeViewKey.SAMPLE_VIEW]: {
    desc: "A view used for prototyping",
    label: "Sample View",
    bundleName: "SampleComponent",
    type: "webview",
  },
  [DendronTreeViewKey.TREE_VIEW]: {
    desc: "Tree View",
    label: "Tree View",
    type: "nativeview",
  },
  [DendronTreeViewKey.BACKLINKS]: {
    desc: "Shows all backlinks to the currentnote",
    label: "Backlinks",
    type: "nativeview",
  },
  [DendronTreeViewKey.CALENDAR_VIEW]: {
    desc: "Calendar View",
    label: "Calendar View",
    type: "webview",
    bundleName: "DendronCalendarPanel",
  },
  [DendronTreeViewKey.LOOKUP_VIEW]: {
    desc: "Lookup View",
    label: "Lookup View",
    type: "webview",
    bundleName: "DendronLookupPanel",
  },
  [DendronTreeViewKey.TIP_OF_THE_DAY]: {
    desc: "Feature Showcase",
    label: "Feature Showcase",
    type: "webview",
    bundleName: "DendronTipOfTheDay",
  },
  [DendronTreeViewKey.RECENT_WORKSPACES]: {
    desc: "Recent Dendron Workspaces",
    label: "Recent Dendron Workspaces",
    type: "nativeview",
  },
  [DendronTreeViewKey.HELP_AND_FEEDBACK]: {
    desc: "Help and Feedback",
    label: "Help and Feedback",
    type: "nativeview",
  },
  [DendronTreeViewKey.GRAPH_PANEL]: {
    desc: "Graph Panel (side)",
    label: "Graph Panel",
    bundleName: "DendronSideGraphPanel",
    type: "webview",
  },
};

export const isWebViewEntry = (
  entry: DendronViewEntry
): entry is DendronWebViewEntry => {
  return entry.type === "webview";
};

export const getWebTreeViewEntry = (
  key: DendronTreeViewKey
): DendronWebViewEntry => {
  const out = TREE_VIEWS[key];
  if (isWebViewEntry(out)) {
    return out;
  }
  throw ErrorFactory.createInvalidStateError({
    message: `${key} is not valid webview key`,
  });
};

export const getWebEditorViewEntry = (
  key: DendronEditorViewKey
): DendronWebViewEntry => {
  const out = EDITOR_VIEWS[key];
  if (isWebViewEntry(out)) {
    return out;
  }
  throw ErrorFactory.createInvalidStateError({
    message: `${key} is not valid webview key`,
  });
};

export enum BacklinkPanelSortOrder {
  /** Using path sorted so order with shallow first = true */
  PathNames = "PathNames",

  LastUpdated = "LastUpdated",
}
