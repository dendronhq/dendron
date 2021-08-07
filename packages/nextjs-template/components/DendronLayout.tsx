import * as React from "react";
import { Col, Layout, Row, Breadcrumb } from "antd";
const { Header, Content, Sider } = Layout;
import DendronTreeView from "./DendronTreeView";
import { DendronCommonProps, NoteData } from "../utils/types";
import { DendronBreadCrumb } from "./DendronBreadCrumb";

export default function DendronLayout(props: React.PropsWithChildren<DendronCommonProps>) {
  return (
    <Layout>
      <br />
      <br />
      <Layout id="main-content-wrap" className="main-content-wrap">
        <Layout>
          <Sider width={200}>
            <DendronTreeView {...props} />
          </Sider>
          <Layout style={{ padding: "0 24px 24px" }}>
						<DendronBreadCrumb {...props}/>
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
