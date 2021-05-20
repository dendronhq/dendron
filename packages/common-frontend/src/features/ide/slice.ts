import { NoteProps } from "@dendronhq/common-all";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type InitialState = {
  noteActive: NoteProps | undefined;
};

export { InitialState as IDEState };

export const ideSlice = createSlice({
  name: "ide",
  initialState: {
    noteActive: undefined,
  } as InitialState,
  reducers: {
    setNoteActive: (state, action: PayloadAction<NoteProps>) => {
      state.noteActive = action.payload;
    },
  },
});
export const actions = ideSlice.actions;
export const reducer = ideSlice.reducer;
