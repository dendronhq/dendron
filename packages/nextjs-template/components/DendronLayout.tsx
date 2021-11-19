import { Layout, Row, Col, Divider, Typography } from "antd";
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
const { Text, Link } = Typography;

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
        position: isResponsive ? "fixed" : "sticky",
        top: `${HEADER.HEIGHT}px`,
        overflow: "auto",
        height: `calc(100vh - ${HEADER.HEIGHT}px)`,
        isolation: "isolate",
        zIndex: 1,
      }}
      trigger={null}
    >
      <div style={{ height: "100%" }}>
        {isResponsive && (
          <div style={{ padding: 16 }}>
            <DendronSearch {...props} />
          </div>
        )}
        <Col
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
          }}
        >
          <DendronTreeMenu
            {...props}
            collapsed={isCollapsed && isResponsive}
            setCollapsed={setCollapsed}
          />
          <Row gutter={1} style={{ margin: "0 auto", padding: "1rem" }}>
            <Text>
              🌱 with{" "}
              <Link href="https://www.dendron.so/" target="_blank">
                Dendron 🌲
              </Link>
            </Text>
          </Row>
        </Col>
      </div>
    </Sider>
  );

  const content = (
    <>
      <Content className="main-content" role="main">
        <Layout>
          <DendronNotice show={getStage() === "dev"}>
            NOTE: Pages are{" "}
            <a href="https://wiki.dendron.so/notes/yYMuhi2TmTC63MysmtwqH.html#navigating-pages-is-slow-for-local-preview">
              dynamically compiled in local preview
            </a>{" "}
            and will take a second to load.
          </DendronNotice>
        </Layout>
        <Layout
          style={{ maxWidth: "1320px", margin: "0 auto", padding: "0 1.5rem" }}
        >
          <DendronBreadCrumb {...props} />
          {props.children}
        </Layout>
        <Layout style={{ maxWidth: "1180px" }}>
          <Divider type="horizontal" />
          <Footer>
            <FooterText />
          </Footer>
        </Layout>
      </Content>
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
            (window as any).mermaid.init();
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
        }}
      >
        <Row
          style={{
            margin: "0 auto",
          }}
          justify={isResponsive ? "space-between" : undefined}
        >
          <Col span={4}>
            <DendronLogoOrTitle />
          </Col>
          <Col xs={0} sm={0} md={18} lg={{ span: 16 }} className="gutter-row">
            <DendronSearch {...props} />
          </Col>
          {isResponsive && (
            <Col xs={4} sm={4} md={0} lg={0}>
              <MenuOutlined
                style={{ fontSize: 24 }}
                onClick={() => setCollapsed(!isCollapsed)}
              />
            </Col>
          )}
        </Row>
      </Header>
      <Layout
        style={{
          marginTop: 64,
        }}
      >
        {sidebar}
        {content}
      </Layout>
    </Layout>
  );
}
