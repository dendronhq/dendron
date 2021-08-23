import { Layout, Row, Col } from "antd";
import * as React from "react";
import {
  DENDRON_STYLE_CONSTANTS,
  ANTD_STYLE_CONSTANTS,
} from "../styles/constants";
import { DendronCommonProps } from "../utils/types";
import { DendronBreadCrumb } from "./DendronBreadCrumb";
import DendronLogoOrTitle from "./DendronLogoOrTitle";
import { DendronLookup } from "./DendronLookup";
import { FooterText } from "./DendronNoteFooter";
import DendronTreeView from "./DendronTreeView";

const { Header, Content, Sider, Footer } = Layout;

export default function DendronLayout(
  props: React.PropsWithChildren<DendronCommonProps>
) {
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <Layout>
      <Header
        style={{
          position: "fixed",
          zIndex: 1,
          width: "100%",
          borderBottom: "1px solid #d4dadf",
        }}
      >
        <Row style={{ height: "100%" }}>
          <Col xs={{ span: 4 }} md={{ span: 4 }} style={{ height: "100%" }}>
            <DendronLogoOrTitle />
          </Col>
          <Col xs={18} md={{ span: 16 }}>
            <DendronLookup {...props} />
          </Col>
        </Row>
      </Header>
      <Layout className="site-layout" style={{ marginTop: 64 }}>
        <Sider
          width={DENDRON_STYLE_CONSTANTS.SIDER.WIDTH}
          collapsible
          collapsed={collapsed}
          collapsedWidth={DENDRON_STYLE_CONSTANTS.SIDER.COLLAPSED_WIDTH}
          onCollapse={(collapsed, type) => {
            setCollapsed(collapsed);
          }}
          breakpoint="lg"
          style={{
            position: "fixed",
            overflow: "auto",
            height: `calc(100vh - ${ANTD_STYLE_CONSTANTS.LAYOUT_HEADER_HEIGHT}px)`,
          }}
        >
          <DendronTreeView {...props} collapsed={collapsed} />
        </Sider>
        <Layout
          style={{
            marginLeft: collapsed
              ? DENDRON_STYLE_CONSTANTS.SIDER.COLLAPSED_WIDTH
              : DENDRON_STYLE_CONSTANTS.SIDER.WIDTH,
          }}
        >
          <Content
            className="main-content"
            role="main"
            style={{ padding: "0 24px" }}
          >
            <DendronBreadCrumb {...props} />
            {props.children}
          </Content>
          <Footer style={{ padding: 0 }}>
            <FooterText />
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  );
}
