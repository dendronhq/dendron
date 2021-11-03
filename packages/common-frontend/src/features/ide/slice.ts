import {
  DendronTreeViewKey,
  DendronWebViewKey,
  NoteProps,
} from "@dendronhq/common-all";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
// @ts-ignore
import internal from "@reduxjs/toolkit/node_modules/immer/dist/internal";

type Theme = "light" | "dark" | "unknown";

type InitialState = {
  noteActive: NoteProps | undefined;
  theme: Theme;
  graphStyles: string;
  views: {
    [key in DendronTreeViewKey | DendronWebViewKey]: {
      ready: boolean;
    };
  };
  seedsInWorkspace: string[] | undefined; // Contains the seed ID's
};

export { InitialState as IDEState };

export const ideSlice = createSlice({
  name: "ide",
  initialState: {
    noteActive: undefined,
    graphStyles: "",
    theme: "unknown",
    views: {
      "dendron.tree-view": {
        ready: false,
      },
    },
    seedsInWorkspace: undefined,
  } as InitialState,
  reducers: {
    setNoteActive: (state, action: PayloadAction<NoteProps | undefined>) => {
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
      state.views[key].ready = ready;
    },
    setSeedsInWorkspace: (state, action: PayloadAction<string[]>) => {
      state.seedsInWorkspace = action.payload;
    },
  },
});
export const actions = ideSlice.actions;
export const reducer = ideSlice.reducer;
