import { nodeActions, nodeEffects } from "../redux/reducers/nodeReducer";

import { AppDispatch } from "../App";
import { DNode } from "@dendron/common-all";
import { IDNode } from "../common/types";
import { Logger } from "@aws-amplify/core";
import Pane from "./Pane";
import { PaneRouteProps } from "./types";
import React from "react";
import { ReduxState } from "../redux/reducers";
import { connect } from "react-redux";
import { loadingActions } from "../redux/reducers/loadingReducer";
import { withRouter } from "react-router-dom";

const { getNode, getAllStubs } = nodeEffects;
const { setActiveNodeId } = nodeActions;
const { setLoadingState } = loadingActions;
const logger = new Logger("DataLoader");

const mapStateToProps = (_state: ReduxState) => ({
  nodeState: _state.nodeReducer,
  loadState: _state.loadingReducer,
});

type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = { dispatch: AppDispatch };

type DataLoaderProps = PaneRouteProps & StateProps & DispatchProps;

class DataLoader extends React.PureComponent<DataLoaderProps> {
  public node?: DNode;

  constructor(props: DataLoaderProps) {
    super(props);
  }
  componentDidMount() {
    this.loadAllStubs().then(() => {
      logger.info({ ctx: "componentDidMount:loadAllStubs:fin" });
      this.loadNode();
    });
  }

  async loadAllStubs() {
    const { loadState, dispatch } = this.props;
    if (loadState.FETCHING_ALL_STUBS) {
      await dispatch(getAllStubs());
      logger.info({ ctx: "loadAllStubs:exit", status: "loaded stubs" });
      return dispatch(
        setLoadingState({ key: "FETCHING_ALL_STUBS", value: false })
      );
    } else {
      logger.info({ ctx: "loadAllStubs:exit", status: "stubs loaded" });
      return;
    }
  }

  loadNode = () => {
    const { props } = this;
    const nodeId = this.props.match.params.id;
    props.dispatch(setLoadingState({ key: "FETCHING_FULL_NODE", value: true }));
    props.dispatch(getNode(nodeId)).then((node: IDNode) => {
      this.node = node;
      props.dispatch(
        setLoadingState({ key: "FETCHING_FULL_NODE", value: false })
      );
      props.dispatch(setLoadingState({ key: "FETCHING_INIT", value: false }));
      props.dispatch(setActiveNodeId({ id: node.id }));
      logger.info({ ctx: "loadNode", status: "done", node });
    });
  };

  render() {
    const fetchNode = this.props.loadState.FETCHING_FULL_NODE;
    if (fetchNode || !this.node) {
      return "DataLoader Loading";
    } else {
      logger.debug({ ctx: "render", node: this.node });
      return <Pane node={this.node} />;
    }
  }
}

const CDataLoader = connect<StateProps, {}, {}, ReduxState>(mapStateToProps)(
  DataLoader
);

export default withRouter<PaneRouteProps, typeof CDataLoader>(CDataLoader);
