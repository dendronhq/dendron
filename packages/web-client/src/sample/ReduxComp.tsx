import React, { ReactElement } from "react";

import { AppDispatch } from "../App";
import { Logger } from "@aws-amplify/core";
import { ReduxState } from "../redux/reducers";
import { connect } from "react-redux";
import { loadingActions } from "../redux/reducers/loadingReducer";
import { sampleActions } from "../redux/reducers/sampleReducer";

const logger = new Logger("Sample");
logger.info("foo");

// const { setActiveNodeId } = nodeActions;
// const { } = userActions;
const { setLoadingState } = loadingActions;
// const { queryOne, getNode } = nodeEffects;

const mapStateToProps = (state: ReduxState) => ({
  userState: state.userReducer,
  loadingState: state.loadingReducer,
  value: state.sampleReducer.value,
});

type ReduxCompOwnProps = {};

type ReduxCompProps = ReturnType<typeof mapStateToProps> & {
  dispatch: AppDispatch;
} & ReduxCompOwnProps;
sampleActions.setValue({ value: 5 });

function ReduxComp(props: ReduxCompProps): ReactElement {
  console.log(props);
  return <div> ReduxComp value: {props.value}</div>;
}

export class ReduxPureComp extends React.PureComponent<ReduxCompProps> {
  loadingExample() {
    const { dispatch } = this.props;

    dispatch(setLoadingState({ key: "FETCHING_INIT", value: true }));
    // do action
    dispatch(setLoadingState({ key: "FETCHING_INIT", value: false }));
  }
  render() {
    const { loadingState } = this.props;
    if (loadingState.FETCHING_INIT) {
      return "Loading...";
    }
    return <div> </div>;
  }
}

export default connect(mapStateToProps, null, null, {
  forwardRef: true,
})(ReduxComp);
