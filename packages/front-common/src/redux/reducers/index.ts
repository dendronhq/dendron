import { LoadingState, loadingReducer } from "./loadingReducer";
import { NodeState, nodeReducer } from "./nodeReducer";
import { SampleState, sampleReducer } from "./sampleReducer";
import { UserState, userReducer } from "./userReducer";

export interface RootReducer {
  sampleReducer: typeof sampleReducer;
  nodeReducer: typeof nodeReducer;
  userReducer: typeof userReducer;
  loadingReducer: typeof loadingReducer;
}
export interface ReduxState {
  sampleReducer: SampleState;
  nodeReducer: NodeState;
  loadingReducer: LoadingState;
  userReducer: UserState;
}

export const rootReducer: RootReducer = {
  sampleReducer,
  nodeReducer,
  loadingReducer,
  userReducer,
};
