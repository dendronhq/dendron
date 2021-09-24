import { Layout, Row, Col, Divider } from "antd";
import { MenuOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import * as React from "react";
import { DENDRON_STYLE_CONSTANTS } from "../styles/constants";
import { DendronCommonProps } from "../utils/types";
import { DendronBreadCrumb } from "./DendronBreadCrumb";
import DendronLogoOrTitle from "./DendronLogoOrTitle";
import { DendronLookup } from "./DendronLookup";
import { FooterText } from "./DendronNoteFooter";
import DendronTreeMenu from "./DendronTreeMenu";
import { DendronSearch } from "./DendronSearch";
import { DendronNotice } from "./DendronNotice";
import { getStage } from "@dendronhq/common-all";

const { Header, Content, Sider, Footer } = Layout;
const { LAYOUT, HEADER, SIDER } = DENDRON_STYLE_CONSTANTS;

export default function DendronLayout(
  props: React.PropsWithChildren<DendronCommonProps>
) {
  const [isCollapsed, setCollapsed] = React.useState(false);
  const [isResponsive, setResponsive] = React.useState(false);

  const sidebar = (
    <Sider
      width={isResponsive ? "100%" : SIDER.WIDTH}
      collapsible
      collapsed={isCollapsed && isResponsive}
      collapsedWidth={SIDER.COLLAPSED_WIDTH}
      onCollapse={(collapsed) => {
        setCollapsed(collapsed);
      }}
      breakpoint="sm"
      onBreakpoint={(broken) => {
        setResponsive(broken);
      }}
      style={{
        position: "fixed",
        overflow: "auto",
        height: `calc(100vh - ${HEADER.HEIGHT}px)`,
      }}
      trigger={null}
    >
      <DendronTreeMenu
        {...props}
        collapsed={isCollapsed && isResponsive}
        setCollapsed={setCollapsed}
      />
    </Sider>
  );

  const content = (
    <>
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
    </>
  );

  return (
    <Layout
      style={{
        width: "100%",
        minHeight: "100%",
      }}
    >
      <Header
        style={{
          position: "fixed",
          zIndex: 1,
          width: "100%",
          borderBottom: "1px solid #d4dadf",
          height: HEADER.HEIGHT,
          padding: `0 ${LAYOUT.PADDING}px 0 2`,
        }}
      >
        <Row
          style={{
            flex: "0 0 auto",
            paddingLeft: `calc((100% - ${LAYOUT.BREAKPOINTS.lg}) / 2)`,
            height: HEADER.HEIGHT,
          }}
        >
          <Col xs={5} md={5} lg={6}>
            <DendronLogoOrTitle />
          </Col>
          <Col xs={14} sm={14} md={10} lg={10} style={{ paddingLeft: "4px" }}>
            <DendronLookup {...props} />
          </Col>
          <Col
            xs={0}
            sm={0}
            md={8}
            lg={6}
            style={{ marginLeft: "4px", marginRight: "4px" }}
          >
            <DendronSearch {...props} />
          </Col>
          <Col
            xs={4}
            sm={4}
            md={0}
            lg={0}
            style={{
              marginLeft: "4px",
              display: isResponsive ? "flex" : "none",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isCollapsed ? (
              <MenuOutlined
                size={32}
                onClick={() => setCollapsed(!isCollapsed)}
              />
            ) : (
              <MenuUnfoldOutlined
                size={32}
                onClick={() => setCollapsed(!isCollapsed)}
              />
            )}
          </Col>
        </Row>
      </Header>
      <Layout
        className="site-layout"
        style={{
          marginTop: 64,
        }}
      >
        <DendronNotice show={getStage() === "dev"}>
          NOTE: Pages are{" "}
          <a href="https://wiki.dendron.so/notes/yYMuhi2TmTC63MysmtwqH.html#navigating-pages-is-slow-for-local-preview">
            dynamically compiled in local preview
          </a>{" "}
          and will take a second to load.
        </DendronNotice>
        <Layout className="site-layout" style={{ flexDirection: "row" }}>
          <Layout
            className="site-layout-sidebar"
            style={{
              flex: "0 0 auto",
              width: `calc((100% - ${LAYOUT.BREAKPOINTS.lg}) / 2 + ${
                // eslint-disable-next-line no-nested-ternary
                isResponsive
                  ? isCollapsed
                    ? SIDER.COLLAPSED_WIDTH
                    : "100%"
                  : SIDER.WIDTH
              }px)`,
              minWidth: isResponsive || isCollapsed
                  ? 0
                  : SIDER.WIDTH,
              paddingLeft: `calc((100% - ${LAYOUT.BREAKPOINTS.lg}) / 2)`,
              // eslint-disable-next-line no-nested-ternary
            }}
          >
            {sidebar}
          </Layout>
          <Layout
            className="side-layout-main"
            style={{
              maxWidth: LAYOUT.CONTENT_MAX_WIDTH,
              display: !isCollapsed && isResponsive ? "none" : "initial",
            }}
          >
            {content}
          </Layout>
        </Layout>
      </Layout>
    </Layout>
  );
}
