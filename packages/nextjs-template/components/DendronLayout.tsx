import { Layout } from "antd";
import * as React from "react";
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
  return (
    <Layout style={{ height: "100%" }}>
      <Header
        style={{
          position: "fixed",
          zIndex: 1,
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          display: "flex",
          borderBottom: "1px solid #d4dadf",
        }}
      >
        <DendronLogoOrTitle />
        <DendronLookup {...props} />
      </Header>
      <Layout
        id="main-content-wrap"
        className="main-content-wrap"
        style={{ flex: 1, marginTop: 64 }}
      >
        <Layout>
          <Sider
            width={200}
            style={{
              position: "fixed",
              height: "100vh",
              paddingLeft: "24px",
              paddingTop: "32px",
              fontSize: "15px",
              overflow: "scroll",
            }}
          >
            <DendronTreeView {...props} />
            <footer
              style={{
                paddingRight: "2em",
                paddingLeft: "2em",
                paddingTop: "2em",
                paddingBottom: "5em",
                fontSize: "12p",
              }}
            >
              🌱 with 💕 using{" "}
              <a href="https://www.dendron.so/"> Dendron 🌲 </a>
            </footer>
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
              <DendronNoteFooter />
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </Layout>
  );
}
