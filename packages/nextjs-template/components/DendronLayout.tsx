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
  const [isCollapsed, setCollapsed] = React.useState(false);
  const [isResponsive, setResponsive] = React.useState(false);

  const sidebar = (
    <Sider
      width={SIDER.WIDTH}
      collapsible
      collapsed={isCollapsed}
      collapsedWidth={SIDER.COLLAPSED_WIDTH}
      onCollapse={(collapsed, type) => {
        setCollapsed(collapsed);
        if (type === "responsive") {
          setResponsive(collapsed);
        }
      }}
      breakpoint="lg"
      style={{
        position: "fixed",
        overflow: "auto",
        height: `calc(100vh - ${HEADER.HEIGHT}px)`,
      }}
      trigger={
        isResponsive ? (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- role indicates that it is a button and therefore interactive
          <div
            role="button"
            tabIndex={0}
            className="ant-trigger"
            style={{
              backgroundColor:
                "#43B02A" /* color copied from packages/dendron-next-server/assets/themes/light-theme.less TODO make dependent on active theme */,
            }}
          >
            {isCollapsed ? <RightOutlined /> : <LeftOutlined />}
          </div>
        ) : null
      }
    >
      <DendronTreeMenu {...props} collapsed={isCollapsed} />
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
          marginTop: 64,
          flexDirection: "row",
        }}
      >
        <Layout
          className="site-layout-sidebar"
          style={{
            flex: "0 0 auto",
            width: `calc((100% - ${LAYOUT.BREAKPOINTS.lg}) / 2 + ${
              isCollapsed ? SIDER.COLLAPSED_WIDTH : SIDER.WIDTH
            }px)`,
            paddingLeft: `calc((100% - ${LAYOUT.BREAKPOINTS.lg}) / 2)`,
            minWidth: isCollapsed ? SIDER.COLLAPSED_WIDTH : SIDER.WIDTH,
          }}
        >
          {sidebar}
        </Layout>
        <Layout
          className="side-layout-main"
          style={{ maxWidth: LAYOUT.CONTENT_MAX_WIDTH }}
        >
          {content}
        </Layout>
      </Layout>
    </Layout>
  );
}
