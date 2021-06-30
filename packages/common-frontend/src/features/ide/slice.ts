import {
  DendronTreeViewKey,
  DendronWebViewKey,
  NoteProps,
} from "@dendronhq/common-all";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Theme = "light" | "dark" | "unknown";

type InitialState = {
  noteActive: NoteProps | undefined;
  theme: Theme;
  views: {
    [key in DendronTreeViewKey | DendronWebViewKey]: {
      ready: boolean;
    };
  };
};

export { InitialState as IDEState };

export const ideSlice = createSlice({
  name: "ide",
  initialState: {
    noteActive: undefined,
    theme: "unknown",
    views: {
      "dendron.tree-view": {
        ready: false,
      },
    },
  } as InitialState,
  reducers: {
    setNoteActive: (state, action: PayloadAction<NoteProps>) => {
      state.noteActive = action.payload;
    },
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    },
    setViewReady: (
      state,
      action: PayloadAction<{ key: DendronTreeViewKey; ready: boolean }>
    ) => {
      const { key, ready } = action.payload;
      state.views[key].ready = ready;
    },
  },
});
export const actions = ideSlice.actions;
export const reducer = ideSlice.reducer;
