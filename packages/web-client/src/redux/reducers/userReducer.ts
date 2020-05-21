import { Action } from "../types";
import { createSlice } from "@reduxjs/toolkit";

type UserAuthState = "signedIn" | "anonymous";

export interface UserState {
  authState: UserAuthState;
}

export interface SetAuthState extends Action {
  payload: {
    authState: UserState["authState"];
  };
}

const initialState: UserState = {
  authState: "anonymous",
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setAuthState(state: UserState, action: SetAuthState) {
      state.authState = action.payload.authState;
    },
  },
});

const { reducer, actions } = userSlice;
const effects = {
  userEffect: () => {
    // some function with an effect
    return;
  },
};

export {
  reducer as userReducer,
  actions as userActions,
  effects as userEffects,
};
