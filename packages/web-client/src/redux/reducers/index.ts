import { SampleState, sampleReducer } from "./sampleReducer";

export interface RootReducer {
  sampleReducer: typeof sampleReducer;
}
export interface ReduxState {
  sampleReducer: SampleState;
}

export const rootReducer: RootReducer = { sampleReducer };
