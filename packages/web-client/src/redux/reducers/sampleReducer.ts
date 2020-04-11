import { Action } from "../types";
import { createSlice } from "@reduxjs/toolkit";

export interface SampleState {
  value: number;
}

export interface SetValue extends Action {
  payload: {
    value: SampleState["value"];
  };
}

const initialState: SampleState = {
  value: 42,
};

const sampleSlice = createSlice({
  name: "sample",
  initialState,
  reducers: {
    setValue(state: SampleState, action: SetValue) {
      state.value = action.payload.value;
    },
  },
});

const { reducer, actions } = sampleSlice;
const effects = {
  sampleEffect: () => {
    // some function with an effect
    return;
  },
};

export {
  reducer as sampleReducer,
  actions as sampleActions,
  effects as sampleEffects,
};
