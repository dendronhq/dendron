import { Layout, Row, Col } from "antd";
import * as React from "react";
import { DENDRON_STYLE_CONSTANTS } from "../styles/constants";
import { DendronCommonProps } from "../utils/types";
import { DendronBreadCrumb } from "./DendronBreadCrumb";
import DendronLogoOrTitle from "./DendronLogoOrTitle";
import { DendronLookup } from "./DendronLookup";
import { DendronNoteFooter } from "./DendronNoteFooter";
import DendronTreeView from "./DendronTreeView";

const { Header, Content, Sider } = Layout;

export default function DendronLayout(
  props: React.PropsWithChildren<DendronCommonProps>
) {
  const [collapsed, setCollapsed] = React.useState(false);
  const siderProps: React.CSSProperties = collapsed
    ? {
        width: "0px",
        overflow: "hidden",
      }
    : {
        overflow: "scroll",
        paddingLeft: DENDRON_STYLE_CONSTANTS.SIDER.PADDING.LEFT,
        position: "fixed",
      };
  return (
    <Layout style={{ height: "100%" }}>
      <Header
        style={{
          position: "fixed",
          zIndex: 1,
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid #d4dadf",
        }}
      >
        <Row>
          <Col xs={{ span: 4 }} md={{ span: 4 }}>
            <DendronLogoOrTitle />
          </Col>
          <Col xs={18} md={{ span: 16 }}>
            <DendronLookup {...props} />
          </Col>
        </Row>
      </Header>
      <Layout
        id="main-content-wrap"
        className="main-content-wrap"
        style={{ flex: 1, marginTop: 64 }}
      >
        <Layout>
          <Sider
            width={collapsed ? 0 : DENDRON_STYLE_CONSTANTS.SIDER.WIDTH}
            style={{
              height: "100%",
              paddingTop: "32px",
              fontSize: "15px",
              ...siderProps,
            }}
            breakpoint="lg"
            collapsedWidth="0"
            onBreakpoint={(broken) => {
              console.log(broken);
            }}
            onCollapse={(collapsed, type) => {
              console.log("collapsed", collapsed, type);
              setCollapsed(collapsed);
            }}
          >
            <DendronTreeView {...props} />
            {/* <footer
              style={{
                position: "fixed",
                bottom: "0px",
                width: "180px",
                padding: "10px",
                fontSize: "12p",
              }}
            >
              🌱 with 💕 using{" "}
              <a href="https://www.dendron.so/"> Dendron 🌲 </a>
            </footer> */}
          </Sider>
          <Layout
            style={{
              padding: collapsed ? "0 0 0" : "0 24px 24px",
              marginLeft: collapsed ? 0 : "200px",
              width: "auto",
            }}
          >
            <DendronBreadCrumb {...props} />
            <Content
              id="main-content"
              className="main-content"
              role="main"
              style={{
                minHeight: 280,
                padding: collapsed ? "5px" : 0,
              }}
            >
              {props.children}
              <DendronNoteFooter />
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </Layout>
  );
}
