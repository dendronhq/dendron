import React from "react";
import { Divider } from "antd";
import { Content, Footer } from "antd/lib/layout/layout";
import { DendronBreadCrumb } from "../DendronBreadCrumb";
import { FooterText } from "../DendronNoteFooter";
import { DENDRON_STYLE_CONSTANTS } from "../../styles/constants";
import { useDendronContext } from "../../context/useDendronContext";

const { LAYOUT } = DENDRON_STYLE_CONSTANTS;

export const DendronContent: React.FC<any> = (props) => {
  const { isResponsive, isSidebarCollapsed } = useDendronContext();
  return (
    <Content
      className="side-layout-main"
      style={{
        maxWidth: "1200px",
        minWidth: 0,
        display: !isSidebarCollapsed && isResponsive ? "none" : "block",
      }}
    >
      <div
        className="main-content"
        role="main"
        style={{ padding: `0 ${LAYOUT.PADDING}px` }}
      >
        <DendronBreadCrumb {...props} />
        {props.children}
      </div>
      <Divider />
      <Footer
        style={{
          padding: `0 ${LAYOUT.PADDING}px ${LAYOUT.PADDING}px`,
        }}
      >
        <FooterText />
      </Footer>
    </Content>
  );
};
