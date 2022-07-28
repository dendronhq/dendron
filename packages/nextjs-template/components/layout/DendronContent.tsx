import React from "react";
import { Divider } from "antd";
import Layout, { Content, Footer } from "antd/lib/layout/layout";
import { DendronBreadCrumb } from "../DendronBreadCrumb";
import { FooterText } from "../DendronNoteFooter";
import { DENDRON_STYLE_CONSTANTS } from "../../styles/constants";
import { useDendronContext } from "../../context/useDendronContext";

const { LAYOUT, HEADER, SIDER } = DENDRON_STYLE_CONSTANTS;

export const DendronContent: React.FC<any> = (props) => {
  const { isResponsive, isSidebarCollapsed } = useDendronContext();
  return (
    <Layout
      className="side-layout-main"
      style={{
        maxWidth: "1200px",
        display: !isSidebarCollapsed && isResponsive ? "none" : "initial",
      }}
    >
      <Content
        className="main-content"
        role="main"
        style={{ padding: `0 ${LAYOUT.PADDING}px` }}
      >
        <DendronBreadCrumb {...props} />
        {props.children}
      </Content>
      <Divider />
      <Footer
        style={{
          padding: `0 ${LAYOUT.PADDING}px ${LAYOUT.PADDING}px`,
        }}
      >
        <FooterText />
      </Footer>
    </Layout>
  );
};
