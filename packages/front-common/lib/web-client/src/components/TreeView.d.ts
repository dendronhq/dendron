import React from "react";
import { ReduxState } from "../redux/reducers";
declare const mapStateToProps: (state: ReduxState) => {
    schemaDict: any;
    treeOrientation: any;
};
declare type TreeViewProps = ReturnType<typeof mapStateToProps>;
interface TreeViewState {
    translate: {
        x: number;
        y: number;
    };
}
declare class TreeView extends React.PureComponent<TreeViewProps, TreeViewState> {
    constructor(props: TreeViewProps);
    onNodeClick: () => void;
    onMouseOver: () => void;
    render(): JSX.Element;
}
export declare const CTreeView: import("react-redux").ConnectedComponent<typeof TreeView, Pick<{
    schemaDict: any;
    treeOrientation: any;
}, never>>;
export {};
