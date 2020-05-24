import Autosuggest from "react-autosuggest";
import { RouteComponentProps } from "react-router-dom";
import { AppDispatch } from "../App";
import { IDNode } from "../common/types";
import React from "react";
import { ReduxState } from "../redux/reducers";
declare const mapStateToProps: (state: ReduxState) => {
    nodeState: import("../redux/reducers/nodeReducer").NodeState;
};
declare type LookupSuggestion = IDNode;
declare type LookupCompProps = ReturnType<typeof mapStateToProps> & {
    style?: any;
    dispatch: AppDispatch;
} & RouteComponentProps;
interface LookupCompState {
    rawValue: string;
    suggestions: LookupSuggestion[];
}
export declare class LookupComp extends React.PureComponent<LookupCompProps, LookupCompState> {
    protected autosuggest?: Autosuggest;
    static defaultProps: {
        style: {};
    };
    constructor(props: LookupCompProps);
    storeInputRef: (input: Autosuggest<any, any>) => void;
    componentDidMount(): void;
    fetchResult: (value: string, reason: "enter" | "input-changed" | "input-focused" | "escape-pressed" | "suggestions-revealed" | "suggestion-selected" | "suggestion-tabbed") => Promise<void>;
    focus: () => void;
    getSuggestions: (value: string) => Promise<IDNode[]>;
    getSuggestionValue: (suggestion: IDNode) => string;
    onChange: (event: React.FormEvent<any>, { newValue, method }: any) => void;
    onKeyDown: (event: any) => Promise<void>;
    onRenderSuggestion: (suggestion: IDNode) => JSX.Element;
    onSuggestionsClearRequested: () => void;
    onSuggestionsFetchRequested: ({ value, reason, }: Autosuggest.SuggestionsFetchRequestedParams) => Promise<void>;
    render(): JSX.Element;
}
export declare type ILookup = LookupComp;
declare const _default: React.ComponentClass<Pick<LookupCompProps, "style" | "dispatch" | "nodeState">, any> & import("react-router").WithRouterStatics<import("react-redux").ConnectedComponent<typeof LookupComp, Pick<LookupCompProps, "match" | "style" | "location" | "history" | "staticContext">>>;
export default _default;
