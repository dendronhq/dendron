import React from "react";
import "antd/dist/antd.css";
import {
  LaptopOutlined,
  NotificationOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Layout, Menu, Input } from "antd";

const { Header, Content, Sider } = Layout;
const items2 = [UserOutlined, LaptopOutlined, NotificationOutlined].map(
  (icon, index) => {
    const key: string = String(index + 1);
    return {
      key: `sub${key}`,
      icon: React.createElement(icon),
      label: `subnav ${key}`,
    };
  }
);

const DendronConfigure = () => (
  <Layout className="settingslayout site-layout-background">
    <Header className="header site-layout-background">
      <Input
        style={{ background: "#383838", color: "white" }}
        placeholder="Basic usage"
      />{" "}
    </Header>
    <Layout>
      <Sider width={200} className="site-layout-background">
        <Menu
          mode="inline"
          defaultSelectedKeys={["1"]}
          defaultOpenKeys={["sub1"]}
          style={{
            height: "100%",
            borderRight: "1px solid #383838",
            background: "#1e1e1e",
          }}
        />
      </Sider>
      <Layout>
        <Content
          className="site-layout-background"
          style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
            color: "white",
          }}
        >
          Content
        </Content>
      </Layout>
    </Layout>
  </Layout>
);

export default DendronConfigure;
