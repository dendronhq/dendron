import Autosuggest, {
  SuggestionsFetchRequestedParams,
} from "react-autosuggest";

import { Logger } from "@aws-amplify/core";
import { NoteNodeStub } from "../common/types";
import React from "react";
import { ReduxState } from "../redux/reducers";
import _ from "lodash";
import { connect } from "react-redux";

/*
import { sampleActions } from "../redux/reducers/sampleReducer";
*/

const logger = new Logger("Lookup");
const mapStateToProps = (state: ReduxState) => ({
  schemaDict: state.nodeReducer.schemaDict,
  noteStubDict: state.nodeReducer.noteStubDict,
});

type LookupSuggestion = NoteNodeStub;

type LookupCompProps = ReturnType<typeof mapStateToProps> & { style?: any };

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
      suggestions: _.values(this.props.noteStubDict),
    };
  }
  getSuggestions = (value: string) => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;
    const suggestions = this.state.suggestions;

    return inputLength === 0
      ? _.values(this.props.noteStubDict)
      : suggestions.filter(
          (sugg) =>
            sugg.data.title.toLowerCase().slice(0, inputLength) === inputValue
        );
  };

  getSuggestionValue = (suggestion: LookupSuggestion) => {
    return suggestion.data.title;
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
  };

  onRenderSuggestion = (suggestion: LookupSuggestion) => {
    return <div className="result">{suggestion.data.title}</div>;
  };

  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: [],
    });
  };

  onSuggestionsFetchRequested = ({
    value,
    reason,
  }: SuggestionsFetchRequestedParams) => {
    logger.info({
      meth: "onSuggestionsFetchRequested",
      ctx: "enter",
      value,
      reason,
    });
    this.setState({
      suggestions: this.getSuggestions(value),
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
        alwaysRenderSuggestions={true}
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
