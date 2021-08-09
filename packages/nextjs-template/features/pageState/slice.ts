import {
	createSlice,
	PayloadAction
} from "@dendronhq/common-frontend";

export enum LoadingStatus {
  IDLE = "idle",
  PENDING = "pending",
  FUFILLED = "fufilled",
}

type PageStateProps = {
  loadingStatus: LoadingStatus;
};

export const slice = createSlice({
  name: "pageState",
  initialState: {
    loadingStatus: LoadingStatus.IDLE,
  } as PageStateProps,
  reducers: {
    setLoadingStatus: (
      state: PageStateProps,
      action: PayloadAction<LoadingStatus>
    ) => {
      state.loadingStatus = action.payload;
    },
  },
});

export const actions = slice.actions;
export const reducer = slice.reducer;
