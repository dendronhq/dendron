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
  /** @deprecated: We will be deprecating treeview v2 and going back to v1 **/
  TREE_VIEW_V2 = "dendron.tree-view",
  BACKLINKS = "dendron.backlinks",
  CALENDAR_VIEW = "dendron.calendar-view",
  LOOKUP_VIEW = "dendron.lookup-view",
}

export const EDITOR_VIEWS: Record<DendronEditorViewKey, DendronViewEntry> = {
  [DendronEditorViewKey.NOTE_PREVIEW]: {
    desc: "Note Preview",
    label: "Note Preview",
    bundleName: "notePreview",
    type: "webview",
  },
  [DendronEditorViewKey.CONFIGURE]: {
    desc: "TODO",
    label: "TODO",
    type: "nativeview",
  },
  [DendronEditorViewKey.NOTE_GRAPH]: {
    desc: "TODO",
    label: "TODO",
    type: "nativeview",
  },
  [DendronEditorViewKey.SCHEMA_GRAPH]: {
    desc: "TODO",
    label: "TODO",
    type: "nativeview",
  },
  [DendronEditorViewKey.SEED_BROWSER]: {
    desc: "TODO",
    label: "TODO",
    type: "nativeview",
  },
};

/**
 * Value is the name of webpack bundle for webview based tree views
 */
export const TREE_VIEWS: Record<DendronTreeViewKey, DendronViewEntry> = {
  [DendronTreeViewKey.TREE_VIEW_V2]: {
    desc: "Tree View",
    label: "Tree View",
    bundleName: "treePanelView",
    type: "webview",
  },
  [DendronTreeViewKey.SAMPLE_VIEW]: {
    desc: "A view used for prototyping",
    label: "Sample View",
    bundleName: "TODO",
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
    bundleName: "TODO",
  },
  [DendronTreeViewKey.LOOKUP_VIEW]: {
    desc: "Lookup View",
    label: "Lookup View",
    type: "webview",
    bundleName: "LookupPanelView",
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
