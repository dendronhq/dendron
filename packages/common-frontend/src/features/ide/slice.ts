import {
  DendronTreeViewKey,
  DendronEditorViewKey,
  NoteProps,
  LookupModifierStatePayload,
  TreeMenu,
  GraphThemeEnum,
} from "@dendronhq/common-all";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
// @ts-ignore
import internal from "@reduxjs/toolkit/node_modules/immer/dist/internal";

type Theme = "light" | "dark" | "unknown";

type InitialState = {
  noteActive: NoteProps | undefined;
  /** The previous value of `noteActive` */
  notePrev: NoteProps | undefined;
  theme: Theme;
  graphStyles: string;
  views: {
    [key in DendronTreeViewKey | DendronEditorViewKey]?: {
      ready: boolean;
    };
  };
  seedsInWorkspace: string[] | undefined; // Contains the seed ID's
  lookupModifiers: LookupModifierStatePayload | undefined;
  tree?: TreeMenu;
  graphTheme?: GraphThemeEnum;
  graphDepth?: number;
  showBacklinks?: boolean;
  showOutwardLinks?: boolean;
  showHierarchy?: boolean;
  isLocked?: boolean;
  previewHTML: string;
};

const INITIAL_STATE: InitialState = {
  noteActive: undefined,
  notePrev: undefined,
  graphStyles: "",
  theme: "unknown",
  views: {},
  seedsInWorkspace: undefined,
  lookupModifiers: undefined,
  tree: undefined,
  graphTheme: GraphThemeEnum.Classic,
  graphDepth: 1,
  showBacklinks: true,
  showOutwardLinks: true,
  showHierarchy: true,
  isLocked: false,
  previewHTML: "",
};

export { InitialState as IDEState };

export const ideSlice = createSlice({
  name: "ide",
  initialState: INITIAL_STATE,
  reducers: {
    setPreviewHTML: (state, action: PayloadAction<string>) => {
      state.previewHTML = action.payload;
    },
    setNoteActive: (state, action: PayloadAction<NoteProps | undefined>) => {
      state.notePrev = state.noteActive;
      state.noteActive = action.payload;
    },
    setTree: (state, action: PayloadAction<TreeMenu>) => {
      state.tree = action.payload;
    },
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    },
    setGraphStyles: (state, action: PayloadAction<string>) => {
      state.graphStyles = action.payload;
    },
    setViewReady: (
      state,
      action: PayloadAction<{ key: DendronTreeViewKey; ready: boolean }>
    ) => {
      const { key, ready } = action.payload;
      state.views[key] = { ready };
    },
    refreshLookup: (
      state,
      action: PayloadAction<LookupModifierStatePayload>
    ) => {
      state.lookupModifiers = action.payload;
    },
    setSeedsInWorkspace: (state, action: PayloadAction<string[]>) => {
      state.seedsInWorkspace = action.payload;
    },
    setGraphTheme: (state, action: PayloadAction<GraphThemeEnum>) => {
      state.graphTheme = action.payload;
    },
    setGraphDepth: (state, action: PayloadAction<number>) => {
      state.graphDepth = action.payload;
    },
    setShowBacklinks: (state, action: PayloadAction<boolean>) => {
      state.showBacklinks = action.payload;
    },
    setShowOutwardLinks: (state, action: PayloadAction<boolean>) => {
      state.showOutwardLinks = action.payload;
    },
    setShowHierarchy: (state, action: PayloadAction<boolean>) => {
      state.showHierarchy = action.payload;
    },
    setLock: (state, action: PayloadAction<boolean>) => {
      state.isLocked = action.payload;
    },
  },
});
export const actions = ideSlice.actions;
export const reducer = ideSlice.reducer;
