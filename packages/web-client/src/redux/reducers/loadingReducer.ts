import { Action } from "./types";
import { createSlice } from "@reduxjs/toolkit";

export interface LoadingState {
  /**
   * Initial fetch. Involves following operations
   * - load node by url
   * - load all Stubs
   */
  FETCHING_ALL_STUBS: boolean;
  // TODO: this should be derived
  FETCHING_INIT: boolean;
  FETCHING_FULL_NODE: boolean;
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
  FETCHING_ALL_STUBS: true,
  FETCHING_INIT: true,
  // fetching initial node by url
  FETCHING_FULL_NODE: true,
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
