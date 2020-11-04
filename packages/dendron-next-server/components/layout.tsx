import { Layout as ALayout, Menu } from "antd";
import Head from "next/head";
import styles from "../styles/layout.module.css";
import utilStyles from "../styles/utils.module.css";
const { Header, Content, Footer, Sider } = ALayout;

const name = "Dendron";
export const siteTitle = "Dendron";

export default function Layout({
  children,
  Signout,
}: {
  children: any;
  Signout: any;
}) {
  return (
    <ALayout style={{height:"100vh"}}>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Dendron" />
        <meta
          property="og:image"
          content={
            "https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/logo-256.png"
          }
        />
        <meta name="og:title" content={siteTitle} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Header>
        <div className={styles.logo}>
          <img
            src="https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/logo-256.png"
            className={`${utilStyles.borderCircle}`}
            id="logo"
            style={{ height: "55px" }}
            alt={name}
          />
        </div>
        <Menu theme="dark" mode="horizontal" style={{ float: "right" }}>
          <Menu.Item key="3">
            {" "}
            <a target="_blank" href="https://dendron.memberful.com/account/subscriptions">Update Subscription</a>
          </Menu.Item>
        </Menu>
      </Header>

      <ALayout>
        <Content
          className={styles.siteLayoutBackground}
          style={{
            padding: 24,
            margin: 0,
            minHeight: 800,
            background: "white"
          }}
        >
          {children}
        </Content>
      </ALayout>
    </ALayout>
  );
}
