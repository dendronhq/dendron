import { nodeActions, nodeEffects } from "../redux/reducers/nodeReducer";

import { DNode } from "../common/node";
import { IDNode } from "../common/types";
import { Logger } from "@aws-amplify/core";
import Pane from "./Pane";
import { PaneRouteProps } from "./types";
import React from "react";
import { ReduxState } from "../redux/reducers";
import { connect } from "react-redux";
import { loadingActions } from "../redux/reducers/loadingReducer";
import { withRouter } from "react-router-dom";

const { getNode } = nodeEffects;
const { setActiveNodeId } = nodeActions;
const { setLoadingState } = loadingActions;
const logger = new Logger("DataLoader");

const mapStateToProps = (_state: ReduxState) => ({
  nodeState: _state.nodeReducer,
});

type DataLoaderProps = ReturnType<typeof mapStateToProps> & {
  dispatch: any;
} & PaneRouteProps;

class DataLoader extends React.PureComponent<DataLoaderProps> {
  public node?: DNode;
  async componentDidMount() {
    logger.info({ ctx: "componentDidMount", props: this.props });
    this.loadNode();
  }

  loadNode = () => {
    const { props } = this;
    const nodeId = this.props.match.params.id;
    props.dispatch(getNode(nodeId)).then((node: IDNode) => {
      this.node = node;
      props.dispatch(setActiveNodeId({ id: node.id }));
      props.dispatch(setLoadingState({ key: "FETCHING_INIT", value: false }));
      logger.info({ ctx: "loadNode", status: "done", node });
    });
  };

  render() {
    if (!this.node) {
      return "DataLoader Loading";
    } else {
      return <Pane node={this.node} />;
    }
  }
}

export default withRouter(connect(mapStateToProps, null)(DataLoader));
