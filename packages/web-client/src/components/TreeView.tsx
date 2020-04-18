import { DComponentProps, dims } from "../config";

import React from "react";
import { ReduxState } from "../redux/reducers";
import { SchemaTree } from "../common/node";
import Tree from "react-d3-tree";
import { connect } from "react-redux";
import styled from "styled-components";

const TREE_TRANSITION_DURATION = 400;

const SAMPLE_YAML = `
  name: project
  schema:
      root:
        children:
          quickstart: 
          topic: 
          version: 
          dev: 
          features:
          rel:
      quickstart:
        desc: get started with project
      features:
        desc: what does it do
      ref:
        kind: namespace
        choices:
            competitors: 
            shortcuts:
      rel:
        desc: relative
      version:
        children:
          version-major: 
          version-minor: 
          version-breaking: 
      plan:
        children:
          requirements:
            alias: req
          timeline:
            desc: "how long will it take"
`;

const STreeDiv = styled.div`
  ${dims("Tree", "global", { forStyledComp: true })}
`;
const mapStateToProps = (state: ReduxState) => ({
  schemaDict: state.nodeReducer.schemaDict,
});
type TreeViewProps = ReturnType<typeof mapStateToProps>;
interface TreeViewState {
  translate: { x: number; y: number };
}

class TreeView extends React.PureComponent<TreeViewProps, TreeViewState> {
  constructor(props: TreeViewProps) {
    super(props);
    const treeDims: Required<DComponentProps> = dims(
      "Tree",
      "global"
    ) as Required<DComponentProps>;
    const { width, height } = treeDims;
    this.state = {
      translate: {
        x: width / 2,
        y: height / 3,
      },
    };
  }

  onNodeClick = () => {};
  onMouseOver = () => {};

  render() {
    const { schemaDict } = this.props;
    const tree = new SchemaTree("root", schemaDict.root, schemaDict);
    const data = tree.toD3Tree();
    return (
      <STreeDiv>
        TreeView
        <Tree
          data={data}
          orientation={"horizontal"}
          separation={{ siblings: 0.3, nonSiblings: 1 }}
          translate={this.state.translate}
          onClick={this.onNodeClick}
          onMouseOver={this.onMouseOver}
          transitionDuration={TREE_TRANSITION_DURATION}
        />
      </STreeDiv>
    );
  }
}

export const CTreeView = connect(mapStateToProps, null, null, {
  forwardRef: true,
})(TreeView);
