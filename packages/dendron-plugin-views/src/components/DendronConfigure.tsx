import React, { useEffect, useState } from "react";
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
import _, { debounce } from "lodash";

const DendronConfigure: DendronComponent = ({ engine }: DendronProps) => {
  const config = _.cloneDeep(engine.config);
  const [searchString, setSearchString] = useState("");
  const [workspace] = useWorkspaceProps();
  const { useConfig } = engineHooks;
  useConfig({ opts: workspace });
  // useEffect(() => {
  //   console.log("searchString", searchString);
  //   const filterObj = schemaConfig.filter(
  //     (config) => !config.label.includes(searchString)
  //   );
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [searchString]);
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

  const handleSearch = debounce((e: any) => {
    console.log(e.target.value);
    setSearchString(e.target.value);
  }, 500);

  return (
    <Layout className="site-layout-background">
      <Header className="header">
        <Input placeholder="search config" onChange={handleSearch} />
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
              height: "100%",
              overflowY: "scroll",
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
