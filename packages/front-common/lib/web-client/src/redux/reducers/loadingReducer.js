import { createSlice } from "@reduxjs/toolkit";
var initialState = {
    FETCHING_ALL_STUBS: true,
    FETCHING_INIT: true,
    // fetching initial node by url
    FETCHING_FULL_NODE: true,
};
var loadingSlice = createSlice({
    name: "loading",
    initialState: initialState,
    reducers: {
        setLoadingState: function (state, action) {
            var _a = action.payload, key = _a.key, value = _a.value;
            state[key] = value;
        },
    },
});
var reducer = loadingSlice.reducer, actions = loadingSlice.actions;
export { reducer as loadingReducer, actions as loadingActions };
//# sourceMappingURL=loadingReducer.js.map