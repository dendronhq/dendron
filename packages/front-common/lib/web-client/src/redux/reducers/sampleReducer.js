import { createSlice } from "@reduxjs/toolkit";
var initialState = {
    value: 42,
};
var sampleSlice = createSlice({
    name: "sample",
    initialState: initialState,
    reducers: {
        setValue: function (state, action) {
            state.value = action.payload.value;
        },
    },
});
var reducer = sampleSlice.reducer, actions = sampleSlice.actions;
var effects = {
    sampleEffect: function () {
        // some function with an effect
        return;
    },
};
export { reducer as sampleReducer, actions as sampleActions, effects as sampleEffects, };
//# sourceMappingURL=sampleReducer.js.map