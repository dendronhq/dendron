import { Action } from "./types";
export interface LoadingState {
    /**
     * Initial fetch. Involves following operations
     * - load node by url
     * - load all Stubs
     */
    FETCHING_ALL_STUBS: boolean;
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
declare const reducer: import("redux").Reducer<LoadingState, import("redux").AnyAction>, actions: import("@reduxjs/toolkit").CaseReducerActions<{
    setLoadingState(state: {
        FETCHING_ALL_STUBS: boolean;
        FETCHING_INIT: boolean;
        FETCHING_FULL_NODE: boolean;
    }, action: SetLoadingAction): void;
}>;
export { reducer as loadingReducer, actions as loadingActions };
