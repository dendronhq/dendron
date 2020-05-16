import Autosuggest, {
  SuggestionsFetchRequestedParams,
} from "react-autosuggest";
import { nodeActions, nodeEffects } from "../redux/reducers/nodeReducer";

import { IDNode } from "../common/types";
import { Logger } from "@aws-amplify/core";
import { NodePreview } from "./NodePreview";
import React from "react";
import { ReduxState } from "../redux/reducers";
import _ from "lodash";
import { connect } from "react-redux";
import { engine } from "../proto/engine";

/*
import { sampleActions } from "../redux/reducers/sampleReducer";
*/

const { setActiveNodeId } = nodeActions;
const { fetchNode } = nodeEffects;
const logger = new Logger("Lookup");
const mapStateToProps = (state: ReduxState) => ({
  nodeState: state.nodeReducer,
  //schemaDict: state.nodeReducer.schemaDict,
  //noteStubDict: state.nodeReducer.noteStubDict,
});

type LookupSuggestion = IDNode;

type LookupCompProps = ReturnType<typeof mapStateToProps> & {
  style?: any;
  dispatch: any;
};

interface LookupCompState {
  rawValue: string;
  suggestions: LookupSuggestion[];
}

export class LookupComp extends React.PureComponent<
  LookupCompProps,
  LookupCompState
> {
  static defaultProps = { style: {} };
  constructor(props: LookupCompProps) {
    super(props);
    this.state = {
      rawValue: "",
      suggestions: _.values(engine().nodes),
    };
  }

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
    const { dispatch } = this.props;
    const node = await dispatch(fetchNode(value));
    logger.info({
      ctx: "fetchResult",
      node,
    });
    dispatch(setActiveNodeId({ id: node.id }));
  };

  getSuggestions = async (value: string) => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;
    const nodes = engine().nodes;
    const suggestions = _.values(nodes);

    return inputLength === 0
      ? _.values(suggestions)
      : suggestions.filter(
          (sugg) =>
            sugg.title.toLowerCase().slice(0, inputLength) === inputValue
        );
  };

  getSuggestionValue = (suggestion: LookupSuggestion) => {
    return suggestion.title;
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
        //   ref={this.storeInputRef}
      />
    );
  }
}

export const CLookupComp = connect(mapStateToProps, null, null, {
  forwardRef: true,
})(LookupComp);
