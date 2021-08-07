import * as React from "react";
import { Col, Layout, Row, Breadcrumb } from "antd";
const { Header, Content, Sider } = Layout;

export default function DendronLayout(props: React.PropsWithChildren<any>) {
  return (
    <Layout>
      <br />
      <br />
      <Layout id="main-content-wrap" className="main-content-wrap">
        <Layout>
          <Sider width={200}>Sider</Sider>
          <Layout style={{ padding: "0 24px 24px" }}>
            <Breadcrumb style={{ margin: "16px 0" }}>
              <Breadcrumb.Item>Home</Breadcrumb.Item>
              <Breadcrumb.Item>List</Breadcrumb.Item>
              <Breadcrumb.Item>App</Breadcrumb.Item>
            </Breadcrumb>
            <Content
              id="main-content"
              className="main-content"
              role="main"
              style={{
                padding: 24,
                minHeight: 280,
								marginLeft: 200
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
