import { DComponentProps, dims } from "../config";

import React from "react";
import { ReduxState } from "../redux/reducers";
import { SchemaTree } from "../common/node";
import Tree from "react-d3-tree";
import { connect } from "react-redux";
import styled from "styled-components";

const TREE_TRANSITION_DURATION = 400;

const STreeDiv = styled.div`
  ${dims("Tree", "global", { forStyledComp: true })}
`;
const mapStateToProps = (state: ReduxState) => ({
  schemaDict: state.nodeReducer.schemaDict,
  treeOrientation: state.nodeReducer.treeOrientation,
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
    const genTranslateForOrientation = (
      orientation: "vertical" | "horizontal",
      width: number,
      height: number
    ): {
      x: number;
      y: number;
    } => {
      if (orientation === "vertical") {
        return {
          x: width / 2,
          y: height / 3,
        };
      } else {
        return {
          x: width / 5,
          y: height / 2,
        };
      }
    };
    const translate = genTranslateForOrientation(
      props.treeOrientation,
      width,
      height
    );
    this.state = {
      translate,
    };
  }

  onNodeClick = () => {};
  onMouseOver = () => {};

  render() {
    const { schemaDict, treeOrientation } = this.props;
    const tree = new SchemaTree("root", schemaDict.root, schemaDict);
    const data = tree.toD3Tree();
    return (
      <STreeDiv>
        TreeView
        <Tree
          data={data}
          orientation={treeOrientation}
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
