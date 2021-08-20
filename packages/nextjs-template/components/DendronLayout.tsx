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

const SIDER_COLLAPSED_WIDTH = 80;

// function DendronLayout(props: React.PropsWithChildren<DendronCommonProps>) {
//   const [collapsed, setCollapsed] = React.useState(false);
//   const siderProps: React.CSSProperties = collapsed
//     ? {
//         width: "0px",
//         overflow: "hidden",
//       }
//     : {
//         overflow: "scroll",
//         paddingLeft: DENDRON_STYLE_CONSTANTS.SIDER.PADDING.LEFT,
//         position: "fixed",
//       };
//   return (
//     <Layout style={{ height: "100%" }}>
//       <Header
//         style={{
//           position: "fixed",
//           zIndex: 1,
//           width: "100%",
//           alignItems: "center",
//           justifyContent: "center",
//           borderBottom: "1px solid #d4dadf",
//         }}
//       >
//         <Row style={{ height: "100%" }}>
//           <Col xs={{ span: 4 }} md={{ span: 4 }} style={{ height: "100%" }}>
//             <DendronLogoOrTitle />
//           </Col>
//           <Col xs={18} md={{ span: 16 }}>
//             <DendronLookup {...props} />
//           </Col>
//         </Row>
//       </Header>
//       <Layout
//         id="main-content-wrap"
//         className="main-content-wrap"
//         style={{ flex: 1, marginTop: 64 }}
//       >
//         <Layout>
//           <Sider
//             width={collapsed ? 0 : DENDRON_STYLE_CONSTANTS.SIDER.WIDTH}
//             style={{
//               height: `calc(100vh - ${ANTD_STYLE_CONSTANTS.LAYOUT_HEADER_HEIGHT}px)`, // `antd`
//               paddingTop: "32px",
//               fontSize: "15px",
//               ...siderProps,
//             }}
//             breakpoint="lg"
//             collapsedWidth="0"
//             onBreakpoint={(broken) => {
//               console.log(broken);
//             }}
//             onCollapse={(collapsed, type) => {
//               console.log("collapsed", collapsed, type);
//               setCollapsed(collapsed);
//             }}
//           >
//             <DendronTreeView {...props} />
//             {/* <footer
//               style={{
//                 position: "fixed",
//                 bottom: "0px",
//                 width: "180px",
//                 padding: "10px",
//                 fontSize: "12p",
//               }}
//             >
//               🌱 with 💕 using{" "}
//               <a href="https://www.dendron.so/"> Dendron 🌲 </a>
//             </footer> */}
//           </Sider>
//           <Layout
//             style={{
//               padding: collapsed ? "0 0 0" : "0 24px 24px",
//               marginLeft: collapsed ? 0 : "200px",
//               width: "auto",
//             }}
//           >
//             <DendronBreadCrumb {...props} />
//             <Content
//               id="main-content"
//               className="main-content"
//               role="main"
//               style={{
//                 minHeight: 280,
//                 padding: collapsed ? "5px" : 0,
//               }}
//             >
//               {props.children}
//               <Footer style={{ padding: 0 }}>
//                 <FooterText />
//               </Footer>
//             </Content>
//           </Layout>
//         </Layout>
//       </Layout>
//     </Layout>
//   );
// }

export default function DendronLayoutV2(
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
          collapsedWidth={SIDER_COLLAPSED_WIDTH}
          onCollapse={(collapsed, type) => {
            setCollapsed(collapsed);
          }}
          trigger={collapsed ? undefined : null}
          breakpoint="lg"
          style={{
            position: "fixed",
            overflow: "auto",
            height: `calc(100vh - ${ANTD_STYLE_CONSTANTS.LAYOUT_HEADER_HEIGHT}px)`,
          }}
        >
          <DendronTreeView {...props} />
        </Sider>
        <Layout
          style={{
            marginLeft: collapsed
              ? SIDER_COLLAPSED_WIDTH
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
