import React, { PureComponent } from "react";

import { Layout } from "antd";
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
  background: black;
`;

export class TopBarComponent extends PureComponent {
  constructor(props: any) {
    super(props);
  }
  render() {
    return (
      <SHeader>
        <Logo logoImg={logo} />
      </SHeader>
    );
  }
}
