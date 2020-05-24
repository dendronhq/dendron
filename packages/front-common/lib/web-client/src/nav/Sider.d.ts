import React from "react";
import { ReduxState } from "../redux/reducers";
declare const mapStateToProps: (state: ReduxState) => {
    schemaDict: {};
};
declare type SiderCompProps = ReturnType<typeof mapStateToProps>;
declare class SiderComp extends React.PureComponent<SiderCompProps> {
    render(): JSX.Element;
}
export declare const CSider: import("react-redux").ConnectedComponent<typeof SiderComp, Pick<{
    schemaDict: {};
}, never>>;
export {};
