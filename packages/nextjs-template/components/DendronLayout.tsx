import { Layout, Menu } from "antd";
import * as React from "react";
import { DendronCommonProps } from "../utils/types";
import { DendronBreadCrumb } from "./DendronBreadCrumb";
import DendronTreeView from "./DendronTreeView";
import { AutoComplete } from "antd";
import { DendronLookup } from "./DendronLookup";
const { Header, Content, Sider } = Layout;

export default function DendronLayout(
  props: React.PropsWithChildren<DendronCommonProps>
) {
  return (
    <Layout style={{ height: "100%" }}>
      <Header
        style={{
          alignItems: "center",
          justifyContent: "center",
          display: "flex",
          borderBottom: "1px solid #d4dadf"
        }}
      >
        <DendronLookup {...props} />
      </Header>
      <Layout
        id="main-content-wrap"
        className="main-content-wrap"
        style={{ flex: 1 }}
      >
        <Layout>
          <Sider width={200} style={{position: 'fixed', height: "100vh", paddingLeft: "24px", paddingTop: "32px", fontSize: "15px"}}>
            <DendronTreeView {...props} />
          </Sider>
          <Layout style={{ padding: "0 24px 24px", marginLeft: "200px" }}>
            <DendronBreadCrumb {...props} />
            <Content
              id="main-content"
              className="main-content"
              role="main"
              style={{
                padding: 24,
                minHeight: 280,
              }}
            >
              {props.children}
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </Layout>
  );
}

// <Row gutter={16}>
//   <Col className="gutter-row" span={2}>
//     <Sider width={200} style={{ background: "#fff" }}>
//       This is the sider
//     </Sider>
//   </Col>
//   <Col className="gutter-row" span={20}>
//     <Layout.Content
//       id="main-content"
//       className="main-content"
//       role="main"
//     >
//       {props.children}
//     </Layout.Content>
//   </Col>
//   <Col className="gutter-row" span={2} />
// </Row>
