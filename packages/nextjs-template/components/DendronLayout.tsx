import { Layout, Row, Col, Divider } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import * as React from "react";
import { DENDRON_STYLE_CONSTANTS } from "../styles/constants";
import { DendronCommonProps } from "../utils/types";
import { DendronBreadCrumb } from "./DendronBreadCrumb";
import DendronLogoOrTitle from "./DendronLogoOrTitle";
import { DendronLookup } from "./DendronLookup";
import { FooterText } from "./DendronNoteFooter";
import DendronTreeMenu from "./DendronTreeMenu";

const { Header, Content, Sider, Footer } = Layout;
const { LAYOUT, HEADER, SIDER } = DENDRON_STYLE_CONSTANTS;

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
          height: HEADER.HEIGHT,
          padding: `0 ${LAYOUT.PADDING}px`,
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
      <Layout
        className="site-layout"
        style={{
          maxWidth: LAYOUT.BREAKPOINTS.lg,
          width: "100%",
          margin: "64px auto 0 auto",
        }}
      >
        <Sider
          width={SIDER.WIDTH}
          collapsible
          collapsed={collapsed}
          collapsedWidth={SIDER.COLLAPSED_WIDTH}
          onCollapse={(collapsed, type) => {
            setCollapsed(collapsed);
          }}
          breakpoint="lg"
          style={{
            position: "fixed",
            overflow: "auto",
            height: `calc(100vh - ${HEADER.HEIGHT}px)`,
          }}
          trigger={
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- role indicates that it is a button and therefore interactive
            <div
              role="button"
              tabIndex={0}
              className="ant-trigger"
              onClick={() => setCollapsed(!collapsed)}
              style={{
                backgroundColor:
                  "#43B02A" /* color copied from packages/dendron-next-server/assets/themes/light-theme.less TODO make dependent on active theme */,
              }}
            >
              {collapsed ? <RightOutlined /> : <LeftOutlined />}
            </div>
          }
        >
          <DendronTreeMenu {...props} collapsed={collapsed} />
        </Sider>
        <Layout
          style={{
            marginLeft: collapsed ? SIDER.COLLAPSED_WIDTH : SIDER.WIDTH,
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
      </Layout>
    </Layout>
  );
}
