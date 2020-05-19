import { Col, Layout, Row } from "antd";
import { DIVIDER_COLOR, dims } from "../config";
import React, { PureComponent } from "react";

import { Link } from "react-router-dom";
import logo from "./../logo.svg";
import styled from "styled-components";

const { Header } = Layout;

const StyledLogoImg = styled.img`
  float: left;
  margin-top: 4px;
  ${dims("Logo", "global", { forStyledComp: true })}
`;

function Logo({ logoImg }: { logoImg: any }) {
  return (
    <Link to={{ pathname: "/home" }}>
      <StyledLogoImg src={logoImg} />
    </Link>
  );
}

const SHeader = styled(Header)`
  background: white;
  border-bottom: 3px solid ${DIVIDER_COLOR};
`;

export class TopBarComponent extends PureComponent {
  constructor(props: any) {
    super(props);
  }
  render() {
    return (
      <SHeader theme="light">
        <Row>
          <Col span={4}>
            <Logo logoImg={logo} />
          </Col>
          <Col span={18}>{this.props.children}</Col>
          <Col span={2}>Menu</Col>
        </Row>
      </SHeader>
    );
  }
}
