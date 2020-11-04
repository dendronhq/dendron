import { Button, Card, Col, Row, Typography } from "antd";
import Head from "next/head";
import Link from "next/link";
import styles from "../styles/layout.module.css";

const { Title, Text, Paragraph } = Typography;
const { Meta } = Card;

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Dendron</title>
        <link rel="icon" href="/favicon.ico" />
        <script type="text/javascript" src="/static/memberful.js"></script>


      </Head>
      <Row>
        <Col offset={8} span={8}>
        </Col>
      </Row>
      <Row>
        <Col offset={8} span={8}>
          <Card
            hoverable
            cover={
              <img
                alt="Environmentalist"
                src="https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/stickers.png"
              />
            }
          >
          </Card>
        </Col>
      </Row>
      <footer className={styles.footer}></footer>
    </div>
  );
}
