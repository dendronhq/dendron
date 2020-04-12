import { DComponentProps, dims } from "../config";

import React from "react";
import Tree from "react-d3-tree";
import styled from "styled-components";

const STreeDiv = styled.div`
  ${dims("Tree", "global", { forStyledComp: true })}
`;
interface TreeViewProps {}
interface TreeViewState {
  translate: { x: number; y: number };
}
const TREE_TRANSITION_DURATION = 400;

export class TreeView extends React.PureComponent<
  TreeViewProps,
  TreeViewState
> {
  constructor(props: TreeViewProps) {
    super(props);
    const treeDims: Required<DComponentProps> = dims(
      "Tree",
      "global"
    ) as Required<DComponentProps>;
    const { width, height } = treeDims;
    this.state = {
      translate: {
        x: width / 5,
        y: height / 1.5,
      },
    };
  }

  onNodeClick = () => {};
  onMouseOver = () => {};

  render() {
    const data = [
      {
        name: "Parent Node",
        attributes: {
          keyA: "val A",
          keyB: "val B",
          keyC: "val C",
        },
        nodeSvgShape: {
          shapeProps: {
            fill: "blue",
          },
        },
        children: [
          {
            name: "Inner Node",
            attributes: {
              keyA: "val A",
              keyB: "val B",
              keyC: "val C",
            },
            nodeSvgShape: {
              shape: "rect",
              shapeProps: {
                width: 20,
                height: 20,
                x: -10,
                y: -10,
                fill: "red",
              },
            },
          },
          {
            name: "Level 2: B",
          },
        ],
      },
    ];
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
