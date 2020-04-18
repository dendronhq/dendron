import React, { ReactElement } from "react";

import { ReduxState } from "../redux/reducers";
import { connect } from "react-redux";
import { sampleActions } from "../redux/reducers/sampleReducer";

const mapStateToProps = (state: ReduxState) => ({
  value: state.sampleReducer.value,
});

type ReduxCompProps = ReturnType<typeof mapStateToProps>;
sampleActions.setValue({ value: 5 });

function ReduxComp(props: ReduxCompProps): ReactElement {
  console.log(props);
  return <div> ReduxComp value: {props.value}</div>;
}

export class ReduxPureComp extends React.PureComponent<ReduxCompProps> {
  render() {
    return <div> </div>;
  }
}

export const CReduxComp = connect(mapStateToProps, null, null, {
  forwardRef: true,
})(ReduxComp);
