import { CSider } from "../nav/Sider";
import { DIVIDER_COLOR } from "../config";
import { Layout } from "antd";
import React from "react";
import { TopBarComponent } from "../nav/TopBar";
import keydown from "react-keydown";
import styled from "styled-components";

const { Content, Sider, Footer } = Layout;

const SSider = styled(Sider)`
  border-right: 3px solid ${DIVIDER_COLOR};
`;

const SContent = styled(Content)`
  background-color: white;
`;
// === Init Start {
export default class DendronLayout extends React.PureComponent {
  public topbar?: TopBarComponent;

  storeTopBar = (comp: TopBarComponent) => {
    if (!this.topbar) {
      this.topbar = comp;
    }
  };

  @keydown(["/", "meta+k"])
  goToSearch(ev: Event) {
    ev.preventDefault();
    ev.stopPropagation();
    if (this.topbar) {
      // TODO
      console.log("bond");
    }
  }

  render() {
    return (
      <Layout>
        <Layout>
          <TopBarComponent ref={this.storeTopBar} />
          <Layout>
            <SSider theme="light">
              <CSider />
            </SSider>
            <SContent>{this.props.children}</SContent>
          </Layout>
        </Layout>
        <Footer>Footer</Footer>
      </Layout>
    );
  }
}
