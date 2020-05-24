import { AppDispatch } from "../App";
import { DNode } from "@dendron/common-all";
import OutlineEditor from "rich-markdown-editor";
import React from "react";
import { ReduxState } from "../redux/reducers";
import { Value } from "slate";
declare const mapStateToProps: (state: ReduxState) => {
    nodeState: import("../redux/reducers/nodeReducer").NodeState;
    loadingState: import("../redux/reducers/loadingReducer").LoadingState;
};
declare type PaneProps = ReturnType<typeof mapStateToProps> & {
    dispatch: AppDispatch;
    node: DNode;
};
declare type PaneState = {
    readOnly: boolean;
    dark: boolean;
};
export declare class PaneComp extends React.Component<PaneProps, PaneState> {
    editor?: OutlineEditor;
    constructor(props: PaneProps);
    state: {
        readOnly: boolean;
        dark: boolean;
    };
    onChange: ({ value }: {
        value: Value;
    }) => void;
    setEditorRef: (ref: OutlineEditor) => void;
    render(): JSX.Element | "Loading...";
}
declare const _default: import("react-redux").ConnectedComponent<typeof PaneComp, Pick<PaneProps, "node">>;
export default _default;
