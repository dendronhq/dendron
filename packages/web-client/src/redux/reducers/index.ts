import { LoadingState, loadingReducer } from "./loadingReducer";
import { NodeState, nodeReducer } from "./nodeReducer";
import { SampleState, sampleReducer } from "./sampleReducer";

export interface RootReducer {
  sampleReducer: typeof sampleReducer;
  nodeReducer: typeof nodeReducer;
  loadingReducer: typeof loadingReducer;
}
export interface ReduxState {
  sampleReducer: SampleState;
  nodeReducer: NodeState;
  loadingReducer: LoadingState;
}

export const rootReducer: RootReducer = {
  sampleReducer,
  nodeReducer,
  loadingReducer,
};
