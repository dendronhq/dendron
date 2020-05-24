import { AppDispatch } from "../App";
import React from "react";
import { ReduxState } from "../redux/reducers";
declare const mapStateToProps: (state: ReduxState) => {
    value: number;
    loadingState: import("../redux/reducers/loadingReducer").LoadingState;
    userState: import("../redux/reducers/userReducer").UserState;
};
declare type HomeOwnProps = {};
declare type HomeProps = ReturnType<typeof mapStateToProps> & {
    dispatch: AppDispatch;
} & HomeOwnProps;
export declare class Home extends React.PureComponent<HomeProps> {
    constructor(props: HomeProps);
    render(): JSX.Element;
}
declare const _default: import("react-redux").ConnectedComponent<typeof Home, Pick<HomeProps, never>>;
export default _default;
