import { AppDispatch } from "../App";
import { DNode } from "@dendron/common-all";
import { PaneRouteProps } from "./types";
import React from "react";
import { ReduxState } from "../redux/reducers";
declare const mapStateToProps: (_state: ReduxState) => {
    nodeState: import("../redux/reducers/nodeReducer").NodeState;
    loadState: import("../redux/reducers/loadingReducer").LoadingState;
};
declare type StateProps = ReturnType<typeof mapStateToProps>;
declare type DispatchProps = {
    dispatch: AppDispatch;
};
declare type DataLoaderProps = PaneRouteProps & StateProps & DispatchProps;
declare class DataLoader extends React.PureComponent<DataLoaderProps> {
    node?: DNode;
    constructor(props: DataLoaderProps);
    componentDidMount(): void;
    loadAllStubs(): Promise<{
        payload: {
            key: "FETCHING_ALL_STUBS" | "FETCHING_INIT" | "FETCHING_FULL_NODE";
            value: boolean;
        };
        type: string;
    } | undefined>;
    loadNode: () => void;
    render(): JSX.Element | "DataLoader Loading";
}
declare const _default: React.ComponentClass<Pick<PaneRouteProps, never>, any> & import("react-router").WithRouterStatics<import("react-redux").ConnectedComponent<typeof DataLoader, Pick<DataLoaderProps, "match" | "location" | "history" | "staticContext">>>;
export default _default;
