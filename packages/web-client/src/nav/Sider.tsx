import React from "react";
import { ReduxState } from "../redux/reducers";
// import { SchemaTree } from "../common/node";
import { Tree } from "antd";
import { connect } from "react-redux";
import styled from "styled-components";

const { DirectoryTree } = Tree;

const mapStateToProps = (state: ReduxState) => ({
  schemaDict: {},
});

type SiderCompProps = ReturnType<typeof mapStateToProps>;

const StyledSiderDiv = styled.div<any>`
  min-height: ${(props: any) => (props.isMobile ? "auto" : "100vh")};
`;

class SiderComp extends React.PureComponent<SiderCompProps> {
  render() {
    const { schemaDict } = this.props;
    // const tree = new SchemaTree("root", schemaDict.root, schemaDict);
    // const treeData = [tree.toAntDTree()];
    const onSelect = () => {
      console.log("Trigger Select");
    };

    const onExpand = () => {
      console.log("Trigger Expand");
    };
    const isMobile = false;
    return (
      <StyledSiderDiv isMobile={isMobile}>
        {/* <DirectoryTree
          multiple
          defaultExpandAll
          onSelect={onSelect}
          onExpand={onExpand}
          treeData={{}}
        /> */}
      </StyledSiderDiv>
    );
  }
}

export const CSider = connect(mapStateToProps, null, null, {
  forwardRef: true,
})(SiderComp);
