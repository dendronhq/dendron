import React, { useState } from "react";
import "antd/dist/antd.css";
import { Layout, Menu, Input, Card, Typography, Space, Divider } from "antd";
import { DendronComponent, DendronProps } from "../types";
import { useWorkspaceProps } from "../hooks";
import { engineHooks } from "@dendronhq/common-frontend";
import {
  ConfigureUIMessage,
  ConfigureUIMessageEnum,
  DMessageSource,
} from "@dendronhq/common-all";
import { postVSCodeMessage } from "../utils/vscode";
import ConfigureElement from "./ConfigureElements";
import _, { debounce } from "lodash";
import { dendronConfig } from "../utils/dendronConfig";

const DendronConfigure: DendronComponent = ({ engine }: DendronProps) => {
  const config = _.cloneDeep(engine.config);
  const [searchString, setSearchString] = useState("");
  const [workspace] = useWorkspaceProps();
  const { useConfig } = engineHooks;
  const configGroupMap = new Map<string, string>();

  useConfig({ opts: workspace });
  if (!config) return <></>;
  Object.keys(dendronConfig).forEach(
    (key) => (dendronConfig[key].default = _.get(config, key))
  );
  const { Header, Content, Sider } = Layout;
  const items = Object.keys(dendronConfig)
    .sort()
    .map((conf) => {
      return {
        key: conf,
        label: _.startCase(dendronConfig[conf].group),
      };
    });
  const menuItems = items.filter(
    (value, index, self) =>
      index === self.findIndex((t) => t.label === value.label)
  );

  const cleanTitle = (title: string) => {
    return title
      .split(".")
      .map((k) => _.startCase(k))
      .join(" > ");
  };

  const postMessage = ({ key, value }: { key: string; value: any }) => {
    _.set(config, key, value);
    postVSCodeMessage({
      type: ConfigureUIMessageEnum.onUpdateConfig,
      data: { config: config },
      source: DMessageSource.webClient,
    } as ConfigureUIMessage);
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    const id = dendronConfig[key].group;
    const element = document.getElementById(id);
    element?.scrollIntoView(true);
  };

  const handleSearch = debounce((e: any) => {
    console.log(e.target.value);
    setSearchString(e.target.value);
  }, 500);

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Header className="header">
        <Input placeholder="search config" onChange={handleSearch} />
      </Header>
      <Layout>
        <Sider width={200}>
          <Menu
            mode="inline"
            style={{
              height: "100%",
              borderRight: "1px solid #383838",
              margin: 0,
            }}
            items={menuItems}
            onClick={handleMenuClick}
          ></Menu>
        </Sider>
        <Layout>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              height: "100%",
              overflowY: "scroll",
            }}
          >
            <Space
              direction="vertical"
              size="middle"
              style={{ display: "flex" }}
            >
              {Object.keys(dendronConfig)
                .sort()
                .filter((conf) =>
                  _.lowerCase(conf).includes(_.lowerCase(searchString))
                )
                .map((conf) => {
                  return (
                    <>
                      {!configGroupMap.has(dendronConfig[conf]?.group) &&
                      configGroupMap.set(dendronConfig[conf]?.group, "") ? (
                        <Divider orientation="left">
                          <Typography.Title
                            level={2}
                            id={dendronConfig[conf]?.group}
                          >
                            {_.startCase(dendronConfig[conf]?.group)}
                          </Typography.Title>
                        </Divider>
                      ) : null}
                      <Card title={cleanTitle(conf)} id={conf}>
                        <Typography.Paragraph>
                          {dendronConfig[conf]?.type !== "boolean"
                            ? dendronConfig[conf]?.description
                            : null}
                        </Typography.Paragraph>
                        <ConfigureElement
                          {...dendronConfig[conf]}
                          name={conf}
                          postMessage={postMessage}
                        />
                      </Card>
                    </>
                  );
                })}
            </Space>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default DendronConfigure;
