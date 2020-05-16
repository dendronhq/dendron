import { DNode } from "../../common/types";
import { NodeState } from "../reducers/nodeReducer";
import { ReduxState } from "../reducers";
import { createSelector } from "@reduxjs/toolkit";
import { engine } from "../../proto/engine";

export const createActiveNoteSelector = createSelector(
  [
    (state: ReduxState): NodeState => {
      return state.nodeReducer;
    },
  ],
  (state: NodeState): DNode => {
    const { activeNodeId } = state;
    return engine().nodes[activeNodeId];
  }
);
