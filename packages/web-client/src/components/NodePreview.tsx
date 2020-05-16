import { IDNode } from "../common/types";
import { Link } from "react-router-dom";
import React from "react";
import styled from "styled-components";

const NodeLink = styled(Link)``;

interface NodePreviewProps {
  node: IDNode;
}

export class NodePreview extends React.PureComponent<NodePreviewProps> {
  render() {
    const { node, ...rest } = this.props;
    return (
      <NodeLink
        to={{
          pathname: node.url,
        }}
        {...rest}
      >
        <div>{node.title}</div>
      </NodeLink>
    );
  }
}
