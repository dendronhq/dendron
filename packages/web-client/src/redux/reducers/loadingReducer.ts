import { Action } from "./types";
import { createSlice } from "@reduxjs/toolkit";

export interface LoadingState {
  FETCHING_INIT: boolean;
}

interface LoadingKeyValue {
  key: string;
  value: boolean;
}

export interface FetchLoadingAction extends Action<LoadingKeyValue> {
  payload: {
    key: string;
    value: boolean;
  };
}

export interface SetLoadingAction extends Action<LoadingKeyValue> {
  payload: {
    key: keyof LoadingState;
    value: boolean;
  };
}

const initialState: LoadingState = {
  FETCHING_INIT: true,
};

const loadingSlice = createSlice({
  name: "loading",
  initialState,
  reducers: {
    setLoadingState(state, action: SetLoadingAction) {
      const { key, value } = action.payload;
      state[key] = value;
    },
  },
});

const { reducer, actions } = loadingSlice;

export { reducer as loadingReducer, actions as loadingActions };
