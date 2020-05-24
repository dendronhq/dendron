import { IDNode } from "../../common/types";
import { NodeState } from "../reducers/nodeReducer";
import { ReduxState } from "../reducers";
export declare const createActiveNoteSelector: import("reselect").OutputSelector<ReduxState, IDNode, (res: NodeState) => IDNode>;
