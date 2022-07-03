import React from "react";
import "antd/dist/antd.css";
import { Layout, Menu, Input, Card, Typography } from "antd";
import { DendronComponent, DendronProps } from "../types";
import { useWorkspaceProps } from "../hooks";
import { engineHooks } from "@dendronhq/common-frontend";
import {
  ConfigureUIMessage,
  ConfigureUIMessageEnum,
  DMessageSource,
} from "@dendronhq/common-all";
import { postVSCodeMessage } from "../utils/vscode";
import { getSchemaConfig } from "../utils/config";
import ConfigureElement from "./ConfigureElements";
import _ from "lodash";

const DendronConfigure: DendronComponent = ({ engine }: DendronProps) => {
  const config = _.cloneDeep(engine.config);
  const [workspace] = useWorkspaceProps();
  const { useConfig } = engineHooks;
  useConfig({ opts: workspace });
  if (!config) return <></>;
  const schemaConfig = getSchemaConfig(config);
  const { Header, Content, Sider } = Layout;
  const items2 = schemaConfig.map((conf) => {
    return {
      key: conf.label,
      label: conf.label,
    };
  });

  const postMessage = (e: any) => {
    const { key, value } = e;
    _.set(config, key, value);
    postVSCodeMessage({
      type: ConfigureUIMessageEnum.onUpdateConfig,
      data: { config: config },
      source: DMessageSource.webClient,
    } as ConfigureUIMessage);
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    const element = document.getElementById(key);
    element?.scrollIntoView(true);
  };

  return (
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
            style={{
              height: "100%",
              borderRight: "1px solid #383838",
            }}
            items={items2}
            onClick={handleMenuClick}
          ></Menu>
        </Sider>
        <Layout>
          <Content
            className="site-layout-background"
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
            }}
          >
            {schemaConfig.map((conf) => (
              <Card title={conf.label} id={conf.label}>
                {conf.children.map((child: any) => (
                  <>
                    <Card type="inner" title={child.label}>
                      <Typography.Paragraph>
                        {child.description ? child.description : null}
                      </Typography.Paragraph>
                      <ConfigureElement
                        {...child}
                        parentLabel={conf.label}
                        postMessage={postMessage}
                      />
                    </Card>
                  </>
                ))}
              </Card>
            ))}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default DendronConfigure;
