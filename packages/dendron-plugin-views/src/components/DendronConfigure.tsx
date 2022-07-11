import React, { useState } from "react";
import "antd/dist/antd.css";
import { Layout, Input, Card, Typography, Space, Divider, Anchor } from "antd";
import { DendronComponent, DendronProps } from "../types";
import { useWorkspaceProps } from "../hooks";
import { engineHooks } from "@dendronhq/common-frontend";
import {
  ConfigureUIMessage,
  ConfigureUIMessageEnum,
  ConfigUtils,
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
  const items = Object.keys(dendronConfig).map((conf) => {
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

  const handleSearch = debounce((e: any) => {
    setSearchString(e.target.value);
  }, 500);

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Header className="header">
        <Input placeholder="search config" onChange={handleSearch} />
      </Header>
      <Layout>
        <Sider
          width={160}
          style={{
            height: "100%",
            borderRight: "1px solid #383838",
            margin: 0,
            padding: "20px 16px 0 21px",
          }}
        >
          <Anchor
            getContainer={() => document.getElementById("configure-content")!}
          >
            <Space
              direction="vertical"
              size="middle"
              style={{ display: "flex" }}
            >
              {menuItems.map((item) => (
                <Anchor.Link
                  key={item.key}
                  href={`#${item.label.toLowerCase()}`}
                  title={item.label}
                />
              ))}
            </Space>
          </Anchor>
        </Sider>
        <Layout>
          <Content
            id="configure-content"
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
                            ? ConfigUtils.getConfigDescription(conf)
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
