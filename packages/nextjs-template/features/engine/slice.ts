import {
  DendronConfig,
  NoteProps,
  NotePropsByIdDict,
} from "@dendronhq/common-all";
import {
  createSlice,
  EngineSliceState,
  LoadingStatus,
  PayloadAction,
} from "@dendronhq/common-frontend";

export type BrowserEngineSliceState = Omit<EngineSliceState, "noteFName"> & {
  noteIndex: NoteProps;
};

export const slice = createSlice({
  name: "engine",
  initialState: {
    loading: LoadingStatus.IDLE,
    error: null,
  } as BrowserEngineSliceState,
  reducers: {
    setLoadingStatus: (
      state: BrowserEngineSliceState,
      action: PayloadAction<LoadingStatus>
    ) => {
      state.loading = action.payload;
    },
    setConfig: (
      state: BrowserEngineSliceState,
      action: PayloadAction<DendronConfig>
    ) => {
      state.config = action.payload;
    },
    setNotes: (state, action: PayloadAction<NotePropsByIdDict>) => {
      state.notes = action.payload;
    },
    setNoteIndex: (state, action: PayloadAction<NoteProps>) => {
      state.noteIndex = action.payload;
    },
  },
});

export const actions = slice.actions;
export const reducer = slice.reducer;
