import React, { ReactElement } from "react";
import { AppDispatch } from "../App";
import { ReduxState } from "../redux/reducers";
declare const mapStateToProps: (state: ReduxState) => {
    userState: import("../redux/reducers/userReducer").UserState;
    loadingState: import("../redux/reducers/loadingReducer").LoadingState;
    value: number;
};
declare type ReduxCompOwnProps = {};
declare type ReduxCompProps = ReturnType<typeof mapStateToProps> & {
    dispatch: AppDispatch;
} & ReduxCompOwnProps;
declare function ReduxComp(props: ReduxCompProps): ReactElement;
export declare class ReduxPureComp extends React.PureComponent<ReduxCompProps> {
    loadingExample(): void;
    render(): JSX.Element | "Loading...";
}
declare const _default: import("react-redux").ConnectedComponent<typeof ReduxComp, Pick<ReduxCompProps, never>>;
export default _default;
