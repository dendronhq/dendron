import { createSlice } from "@reduxjs/toolkit";
var initialState = {
    authState: "anonymous",
};
var userSlice = createSlice({
    name: "user",
    initialState: initialState,
    reducers: {
        setAuthState: function (state, action) {
            state.authState = action.payload.authState;
        },
    },
});
var reducer = userSlice.reducer, actions = userSlice.actions;
var effects = {
    userEffect: function () {
        // some function with an effect
        return;
    },
};
export { reducer as userReducer, actions as userActions, effects as userEffects, };
//# sourceMappingURL=userReducer.js.map