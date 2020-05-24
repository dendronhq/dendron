import { Action } from "../types";
declare type UserAuthState = "signedIn" | "anonymous";
export interface UserState {
    authState: UserAuthState;
}
export interface SetAuthState extends Action {
    payload: {
        authState: UserState["authState"];
    };
}
declare const reducer: import("redux").Reducer<UserState, import("redux").AnyAction>, actions: import("@reduxjs/toolkit").CaseReducerActions<{
    setAuthState(state: UserState, action: SetAuthState): void;
}>;
declare const effects: {
    userEffect: () => void;
};
export { reducer as userReducer, actions as userActions, effects as userEffects, };
