import Lookup, { ILookup } from "./Lookup";

import { CSider } from "../nav/Sider";
import { DIVIDER_COLOR } from "../config";
import { Layout } from "antd";
import { Logger } from "@aws-amplify/core";
import React from "react";
import { TopBarComponent } from "../nav/TopBar";
import keydown from "react-keydown";
import styled from "styled-components";

const logger = new Logger("DendronLayout");

const { Content, Sider, Footer } = Layout;

const SSider = styled(Sider)`
  border-right: 3px solid ${DIVIDER_COLOR};
`;

const SContent = styled(Content)`
  background-color: white;
`;
// === Init Start {
export default class DendronLayout extends React.PureComponent {
  public lookup?: ILookup;

  storeLookup = (comp: ILookup) => {
    if (!this.lookup) {
      this.lookup = comp;
    }
  };

  @keydown(["/", "meta+k"])
  goToSearch(ev: Event) {
    ev.preventDefault();
    ev.stopPropagation();
    if (this.lookup) {
      this.lookup.focus();
      // TODO
      console.log("bond");
    } else {
      console.log("non-bond");
    }
  }

  render() {
    logger.debug({ ctx: "render" });
    // needed because withRouter types is a cluster
    const TLookup: any = Lookup;
    return (
      <Layout>
        <Layout>
          <TopBarComponent>
            <TLookup wrappedComponentRef={this.storeLookup} />
          </TopBarComponent>
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
