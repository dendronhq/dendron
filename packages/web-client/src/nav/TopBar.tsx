import { Col, Layout, Row } from "antd";
import React, { PureComponent } from "react";

import { CLookupComp } from "../components/Lookup";
import { dims } from "../config";
import logo from "./../logo.svg";
import styled from "styled-components";

const { Header } = Layout;

const StyledLogoImg = styled.img`
  float: left;
  margin-top: 4px;
  ${dims("Logo", "global", { forStyledComp: true })}
`;

function Logo({ logoImg }: { logoImg: any }) {
  return <StyledLogoImg src={logoImg} />;
}

const SHeader = styled(Header)`
  background: white;
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
          <Col span={18}>
            <CLookupComp />
          </Col>
          <Col span={2}>Menu</Col>
        </Row>
      </SHeader>
    );
  }
}
