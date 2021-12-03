import { Layout, Row, Col, Divider } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import * as React from "react";
import { DENDRON_STYLE_CONSTANTS } from "../styles/constants";
import { DendronCommonProps } from "../utils/types";
import { DendronBreadCrumb } from "./DendronBreadCrumb";
import DendronLogoOrTitle from "./DendronLogoOrTitle";
import { FooterText } from "./DendronNoteFooter";
import DendronTreeMenu from "./DendronTreeMenu";
import { DendronSearch } from "./DendronSearch";
import Script from "next/script";
import { useEngineAppSelector } from "../features/engine/hooks";
import DendronNotice from "./DendronNotice";
import {
  ConfigUtils,
  getStage,
  IntermediateDendronConfig,
} from "@dendronhq/common-all";

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
      {isResponsive && (
        <div style={{ padding: 16 }}>
          <DendronSearch {...props} />
        </div>
      )}
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

  const engine = useEngineAppSelector((state) => state.engine);
  const config = engine.config as IntermediateDendronConfig;
  const enableMermaid = ConfigUtils.getProp(config, "mermaid");

  return (
    <Layout
      style={{
        width: "100%",
        minHeight: "100%",
      }}
    >
      {enableMermaid && (
        <Script
          id="initmermaid"
          src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"
          onLoad={() => {
            const mermaid = (window as any).mermaid;
            // save for debugging
            // when trying to access mermaid in DOM, <div id="mermaid"></div> gets returned
            // we disambiguate by saving a copy of mermaid
            (window as any)._mermaid = mermaid;

            mermaid.initialize({
              startOnLoad: false,
            });
            // initialize
            mermaid.init();
          }}
        />
      )}
      <Header
        style={{
          position: "fixed",
          isolation: "isolate",
          zIndex: 1,
          width: "100%",
          borderBottom: "1px solid #d4dadf",
          height: HEADER.HEIGHT,
          padding: isResponsive ? 0 : `0 ${LAYOUT.PADDING}px 0 2px`,
        }}
      >
        <Row
          justify="center"
          style={{
            maxWidth: "992px",
            justifyContent: "space-between",
            margin: "0 auto",
          }}
        >
          <Col>
            <DendronLogoOrTitle />
          </Col>
          <Col xs={0} sm={20} md={20} lg={19} className="gutter-row">
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
            <MenuOutlined
              style={{ fontSize: 24 }}
              onClick={() => setCollapsed(!isCollapsed)}
            />
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
              minWidth: isResponsive || isCollapsed ? 0 : SIDER.WIDTH,
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
