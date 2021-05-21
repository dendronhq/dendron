import { NoteProps } from "@dendronhq/common-all";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Theme = "light" | "dark" | "unknown";

type InitialState = {
  noteActive: NoteProps | undefined;
  theme: Theme;
};

export { InitialState as IDEState };

export const ideSlice = createSlice({
  name: "ide",
  initialState: {
    noteActive: undefined,
    theme: "unknown",
  } as InitialState,
  reducers: {
    setNoteActive: (state, action: PayloadAction<NoteProps>) => {
      state.noteActive = action.payload;
    },
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    },
  },
});
export const actions = ideSlice.actions;
export const reducer = ideSlice.reducer;
