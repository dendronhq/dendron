import {
  DendronTreeViewKey,
  DendronEditorViewKey,
  NoteProps,
  LookupModifierStatePayload,
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
  /** Remap image URLs to a new URL. Only used by the plugin right now.
   *
   * null indicates we sent a request for this url already, and shouldn't re-send one.
   */
  imageUrls: { [url: string]: string | null };
};

type SetImageUrlPayload = {
  url: string;
  mappedTo: string | null;
};

const INITIAL_STATE: InitialState = {
  noteActive: undefined,
  notePrev: undefined,
  graphStyles: "",
  theme: "unknown",
  views: {
    "dendron.tree-view": {
      ready: false,
    },
  },
  seedsInWorkspace: undefined,
  lookupModifiers: undefined,
  imageUrls: {},
};

export { InitialState as IDEState };

export const ideSlice = createSlice({
  name: "ide",
  initialState: INITIAL_STATE,
  reducers: {
    setNoteActive: (state, action: PayloadAction<NoteProps | undefined>) => {
      state.notePrev = state.noteActive;
      state.noteActive = action.payload;
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
    setImageUrl: (state, action: PayloadAction<SetImageUrlPayload>) => {
      const { url, mappedTo } = action.payload;
      state.imageUrls[url] = mappedTo;
    },
  },
});
export const actions = ideSlice.actions;
export const reducer = ideSlice.reducer;
