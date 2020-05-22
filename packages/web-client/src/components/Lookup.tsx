import Autosuggest, {
  SuggestionsFetchRequestedParams,
} from "react-autosuggest";
import { RouteComponentProps, withRouter } from "react-router-dom";

import { AppDispatch } from "../App";
import { IDNode } from "../common/types";
import { Logger } from "@aws-amplify/core";
import { NodePreview } from "./NodePreview";
import React from "react";
import { ReduxState } from "../redux/reducers";
import _ from "lodash";
import { connect } from "react-redux";
import { engine } from "../proto/engine";
import { nodeEffects } from "../redux/reducers/nodeReducer";

/*
import { sampleActions } from "../redux/reducers/sampleReducer";
*/

const { fetchNode, fetchNodes } = nodeEffects;
const logger = new Logger("Lookup");
const mapStateToProps = (state: ReduxState) => ({
  nodeState: state.nodeReducer,
  //schemaDict: state.nodeReducer.schemaDict,
  //noteStubDict: state.nodeReducer.noteStubDict,
});

type LookupSuggestion = IDNode;

type LookupCompProps = ReturnType<typeof mapStateToProps> & {
  style?: any;
  dispatch: AppDispatch;
} & RouteComponentProps;

interface LookupCompState {
  rawValue: string;
  suggestions: LookupSuggestion[];
}

export class LookupComp extends React.PureComponent<
  LookupCompProps,
  LookupCompState
> {
  protected autosuggest?: Autosuggest;
  static defaultProps = { style: {} };
  constructor(props: LookupCompProps) {
    super(props);
    this.state = {
      rawValue: "",
      suggestions: _.values(engine().nodes),
    };
  }

  storeInputRef = (input: Autosuggest) => {
    if (input !== null) {
      this.autosuggest = input;
    }
  };
  // --- LifeCycle
  componentDidMount() {
    this.focus();
  }

  // ---
  fetchResult = async (
    value: string,
    reason:
      | SuggestionsFetchRequestedParams["reason"]
      | "enter"
      | "suggestion-tabbed"
  ) => {
    logger.info({
      ctx: "fetchResult:enter",
      value,
      reason,
    });
    const { history, dispatch } = this.props;
    if (value === "") {
      value = "root";
    }
    const node = await dispatch(fetchNode(value));
    history.push(node.url);
  };

  focus = () => {
    const autosuggest = this.autosuggest;
    if (autosuggest && autosuggest.input) {
      autosuggest.input.focus();
    }
  };

  getSuggestions = async (value: string) => {
    const suggestions = await this.props.dispatch(fetchNodes(value));
    return suggestions;
  };

  getSuggestionValue = (suggestion: LookupSuggestion) => {
    return suggestion.path;
  };

  onChange = (event: React.FormEvent<any>, { newValue, method }: any) => {
    logger.info({
      meth: "onChange",
      ctx: "enter",
      event,
      newValue,
      method,
    });
    this.setState({ rawValue: newValue });
  };

  onKeyDown = async (event: any) => {
    const { keyCode } = event;
    logger.info({
      meth: "onKeyDown",
      ctx: "enter",
      keyCode,
    });
    switch (keyCode) {
      case 13: // enter
        this.fetchResult(this.state.rawValue, "enter");
        break;
    }
  };

  onRenderSuggestion = (suggestion: LookupSuggestion) => {
    return (
      <div className="result">
        <NodePreview node={suggestion} />
      </div>
    );
  };

  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: [],
    });
  };

  onSuggestionsFetchRequested = async ({
    value,
    reason,
  }: SuggestionsFetchRequestedParams) => {
    logger.info({
      meth: "onSuggestionsFetchRequested",
      ctx: "enter",
      value,
      reason,
    });
    const suggestions = await this.getSuggestions(value);
    this.setState({
      suggestions,
    });
  };

  render() {
    const { suggestions, rawValue } = this.state;
    const { style } = this.props;
    logger.info({ meth: "render", ctx: "enter" });
    const inputProps = {
      placeholder: "Lookup",
      value: rawValue,
      onChange: this.onChange,
      autoFocus: true,
      onKeyDown: this.onKeyDown,
      style,
    };
    return (
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={this.getSuggestionValue}
        renderSuggestion={this.onRenderSuggestion}
        //   shouldRenderSuggestions={this.shouldRenderSuggestions}
        inputProps={inputProps}
        //   highlightFirstSuggestion={false}
        //   onSuggestionHighlighted={this.onSuggestionHighlighted}
        alwaysRenderSuggestions={false}
        multiSection={false}
        //   getSectionSuggestions={this.getSectionSuggestions}
        //   renderSectionTitle={this.renderSectionTitle}
        //   onSuggestionSelected={this.onSuggestionSelected}
        //   renderInputComponent={this.renderInputComponent}
        //   renderSuggestionsContainer={this.onRenderSuggestionsContainer}
        ref={this.storeInputRef}
      />
    );
  }
}

const CLookupComp = connect(mapStateToProps, null, null, { forwardRef: true })(
  LookupComp
);
export type ILookup = LookupComp;
export default withRouter<LookupCompProps, typeof CLookupComp>(CLookupComp);
