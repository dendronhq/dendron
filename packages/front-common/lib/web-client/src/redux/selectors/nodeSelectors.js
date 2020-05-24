import { createSelector } from "@reduxjs/toolkit";
import { engine } from "../../proto/engine";
export var createActiveNoteSelector = createSelector([
    function (state) {
        return state.nodeReducer;
    },
], function (state) {
    var activeNodeId = state.activeNodeId;
    return engine().nodes[activeNodeId];
});
//# sourceMappingURL=nodeSelectors.js.map