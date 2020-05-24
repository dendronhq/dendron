import { Action } from "../types";
export interface SampleState {
    value: number;
}
export interface SetValue extends Action {
    payload: {
        value: SampleState["value"];
    };
}
declare const reducer: import("redux").Reducer<SampleState, import("redux").AnyAction>, actions: import("@reduxjs/toolkit").CaseReducerActions<{
    setValue(state: SampleState, action: SetValue): void;
}>;
declare const effects: {
    sampleEffect: () => void;
};
export { reducer as sampleReducer, actions as sampleActions, effects as sampleEffects, };
