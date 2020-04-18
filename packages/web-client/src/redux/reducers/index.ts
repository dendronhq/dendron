import { NodeState, nodeReducer } from "./nodeReducer";
import { SampleState, sampleReducer } from "./sampleReducer";

export interface RootReducer {
  sampleReducer: typeof sampleReducer;
  nodeReducer: typeof nodeReducer;
}
export interface ReduxState {
  sampleReducer: SampleState;
  nodeReducer: NodeState;
}

export const rootReducer: RootReducer = { sampleReducer, nodeReducer };
