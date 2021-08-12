import {
	createSlice,
	PayloadAction,
  EngineSliceState,
  LoadingStatus
} from "@dendronhq/common-frontend";
import { DendronConfig, NotePropsDict } from "@dendronhq/common-all";

export const slice = createSlice({
  name: "engine",
  initialState: {
    loading: LoadingStatus.IDLE,
    error: null,
  } as EngineSliceState,
  reducers: {
    setLoadingStatus: (
      state: EngineSliceState,
      action: PayloadAction<LoadingStatus>
    ) => {
      state.loading = action.payload;
    },
    setConfig: (
      state: EngineSliceState,
      action: PayloadAction<DendronConfig>
    ) => {
      state.config = action.payload;
    },
    setNotes: (state, action: PayloadAction<NotePropsDict>) => {
      state.notes = action.payload;
    },
  },
});

export const actions = slice.actions;
export const reducer = slice.reducer;
