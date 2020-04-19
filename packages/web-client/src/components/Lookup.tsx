import Autosuggest, {
  SuggestionsFetchRequestedParams,
} from "react-autosuggest";

import { Logger } from "@aws-amplify/core";
import React from "react";
import { ReduxState } from "../redux/reducers";
import { connect } from "react-redux";

/*
import { sampleActions } from "../redux/reducers/sampleReducer";
*/

const logger = new Logger("Lookup");
const mapStateToProps = (state: ReduxState) => ({
  schemaDict: state.nodeReducer.schemaDict,
});

interface LookupSuggestion {}

type LookupCompProps = ReturnType<typeof mapStateToProps> & { style?: any };

interface LookupCompState {
  rawValue: string;
  suggestions: LookupSuggestion[];
}

// export class LookupComp extends Autosuggest {
//   constructor(props: LookupCompProps) {
//     super({ alwaysRenderSuggestions: true });
//   }
// }

export class LookupComp extends React.PureComponent<
  LookupCompProps,
  LookupCompState
> {
  static defaultProps = { style: {} };
  constructor(props: LookupCompProps) {
    super(props);
    this.state = {
      rawValue: "",
      suggestions: [],
    };
  }

  getSuggestionValue = (suggestion: LookupSuggestion) => {
    // TODO
    return "";
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
    // let parent: string | null = _.get(suggestion.edge, "parentTitle", null);
    // if (!_.isNull(parent)) {
    //   if (parent === "__root") {
    //     parent = null;
    //   } else {
    //     parent = `${parent}/`;
    //   }
    // }
    // if (suggestion.prefix === "new") {
    //   return (
    //     <div className="result">
    //       <span>{parent}</span>
    //       No results found
    //     </div>
    //   );
    // }
    return (
      <div className="result">
        Suggestions
        {/* <span>{parent}</span>
        {suggestion.name} */}
      </div>
    );
  };

  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: [],
    });
  };

  async onSuggestionsFetchRequested({
    value,
    reason,
  }: SuggestionsFetchRequestedParams) {
    logger.info({
      meth: "onSuggestionsFetchRequested",
      ctx: "enter",
      value,
      reason,
    });
  }

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
        //   alwaysRenderSuggestions={false}
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
