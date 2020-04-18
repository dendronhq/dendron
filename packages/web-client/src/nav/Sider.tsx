import React, { ReactElement } from "react";

import { ReduxState } from "../redux/reducers";
import { Tree } from "antd";
import { connect } from "react-redux";
import styled from "styled-components";

const { DirectoryTree } = Tree;

const mapStateToProps = (state: ReduxState) => ({
  value: state.sampleReducer.value,
});

type SiderCompProps = ReturnType<typeof mapStateToProps>;

const StyledSiderDiv = styled.div<any>`
  min-height: ${(props: any) => (props.isMobile ? "auto" : "100vh")};
`;

class SiderComp extends React.PureComponent {
  render() {
    const treeData = [
      {
        title: "parent 0",
        key: "0-0",
        children: [
          { title: "leaf 0-0", key: "0-0-0", isLeaf: true },
          { title: "leaf 0-1", key: "0-0-1", isLeaf: true },
        ],
      },
      {
        title: "parent 1",
        key: "0-1",
        children: [
          { title: "leaf 1-0", key: "0-1-0", isLeaf: true },
          { title: "leaf 1-1", key: "0-1-1", isLeaf: true },
        ],
      },
    ];
    const onSelect = (keys: any, event: any) => {
      console.log("Trigger Select");
    };

    const onExpand = () => {
      console.log("Trigger Expand");
    };
    const isMobile = false;
    return (
      <StyledSiderDiv isMobile={isMobile}>
        <DirectoryTree
          multiple
          defaultExpandAll
          onSelect={onSelect}
          onExpand={onExpand}
          treeData={treeData}
        />
      </StyledSiderDiv>
    );
  }
}

export const CSider = connect(mapStateToProps, null, null, {
  forwardRef: true,
})(SiderComp);
