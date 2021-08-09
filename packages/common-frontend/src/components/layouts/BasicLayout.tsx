import * as React from "react";
import { Col, Layout, Row } from "antd";

export function BasicLayout(props: React.PropsWithChildren<any>) {
  return (
    <Layout>
      <br />
      <br />
      <Layout id="main-content-wrap" className="main-content-wrap">
        <Row gutter={16}>
          <Col className="gutter-row" span={2}/>
          <Col className="gutter-row" span={20}>
            <Layout.Content
              id="main-content"
              className="main-content"
              role="main"
            >
              {props.children}
            </Layout.Content>
          </Col>
          <Col className="gutter-row" span={2}/>
        </Row>
      </Layout>
    </Layout>
  );
}
