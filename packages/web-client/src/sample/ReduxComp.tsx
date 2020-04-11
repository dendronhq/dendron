import React, { ReactElement } from "react";

import { ReduxState } from "../redux/reducers";
import { connect } from "react-redux";

const mapStateToProps = (state: ReduxState) => ({
  value: state.sampleReducer.value,
});

type ReduxCompProps = ReturnType<typeof mapStateToProps>;

function ReduxComp(props: ReduxCompProps): ReactElement {
  console.log(props);
  return <div> ReduxComp value: {props.value}</div>;
}

export const CReduxComp = connect(mapStateToProps, null, null, {
  forwardRef: true,
})(ReduxComp);
