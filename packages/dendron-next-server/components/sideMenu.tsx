import React from "react";
import { Layout, Menu } from "antd";
import get from "lodash/get";
import isEmpty from "lodash/isEmpty";

import { Config, ObjectConfig } from "../types/formTypes";
import { shouldDisplay } from "../utils/shouldDisplay";
import dendronValidator from "../data/dendron-yml.validator.json";
import bucketConfig, { buckets } from "../data/bucketConfig";
import { generateRenderableConfig } from "../utils/formUtils";

const { Sider } = Layout;
const { SubMenu } = Menu;

type DefaultProptypes = {
  openKeys: string[];
  setOpenKeys: (openKeys: string[]) => void;
  selectedKeys: string[];
  setSelectedKeys: (selectedKeys: string[]) => void;
  currentValues: any;
  dendronFormConfig: Config;
  anyOfValues: { [key: string]: string };
};

const generateMenu = (
  dataDefinition: Config,
  prefix: string[] = [],
  currentValues: any,
  anyOfValues: { [key: string]: string }
): JSX.Element => {
  if (!dataDefinition) return <></>;
  const name = prefix.join(".");
  const lastName = (prefix.length && prefix[prefix.length - 1]) || "";
  if (!shouldDisplay(lastName)) return <></>;

  if (
    dataDefinition.type === "string" ||
    dataDefinition.type === "number" ||
    dataDefinition.type === "boolean" ||
    dataDefinition.type === "enum"
  ) {
    return (
      <Menu.Item
        key={name}
        style={{
          lineHeight: "1.5rem",
          height: "1.5rem",
        }}
      >
        <a href={`#${name}`}>{prefix[prefix.length - 1]}</a>
      </Menu.Item>
    );
  }

  if (dataDefinition.type === "array") {
    const values = get(currentValues, name) ?? [];
    return (
      <SubMenu
        key={name}
        title={<a href={`#${prefix.join(".")}`}>{prefix[prefix.length - 1]}</a>}
      >
        {values.map((value: any, index: number) =>
          generateMenu(
            dataDefinition.data,
            [...prefix, index.toString()],
            currentValues,
            anyOfValues
          )
        )}
      </SubMenu>
    );
  }

  if (dataDefinition.type === "anyOf") {
    const currentMode: string = anyOfValues[name];
    console.log({ dataDefinition, currentMode });
    return generateMenu(
      dataDefinition.data[currentMode === "basic" ? 0 : 1],
      prefix,
      currentValues,
      anyOfValues
    );
  }

  if (dataDefinition.type === "record") {
    const values = get(currentValues, name) ?? {};
    return (
      <SubMenu
        key={name}
        title={<a href={`#${prefix.join(".")}`}>{prefix[prefix.length - 1]}</a>}
      >
        {Object.keys(values).map((value: any) =>
          generateMenu(
            dataDefinition.data,
            [...prefix, value],
            currentValues,
            anyOfValues
          )
        )}
      </SubMenu>
    );
  }

  // the rest is logic for handling object type

  return (
    <SubMenu
      key={name}
      title={<a href={`#${prefix.join(".")}`}>{prefix[prefix.length - 1]}</a>}
    >
      {Object.keys((dataDefinition as ObjectConfig).data).map((key) =>
        generateMenu(
          (dataDefinition as ObjectConfig).data[key],
          [...prefix, key],
          currentValues,
          anyOfValues
        )
      )}
    </SubMenu>
  );
};

const SideMenu: React.FC<DefaultProptypes> = ({
  openKeys,
  setOpenKeys,
  selectedKeys,
  setSelectedKeys,
  currentValues,
  dendronFormConfig: dendronFormConfig,
  anyOfValues,
}) => {
  const onSelectedChange = ({ selectedKeys }: any) => {
    setSelectedKeys(selectedKeys);
  };

  const onOpenChange = (openKeys: any[]) => setOpenKeys(openKeys);

  return (
    <Sider theme="light">
      <Menu
        theme="light"
        style={{
          overflowX: "hidden",
          overflowY: "scroll",
          height: "100vh",
          minWidth: "100%",
          width: "max-content",
          fontSize: "0.9rem",
          fontFamily: "monospace",
          borderWidth: 0,
        }}
        inlineIndent={10}
        mode="inline"
        selectedKeys={selectedKeys}
        onSelect={onSelectedChange}
        openKeys={openKeys}
        onOpenChange={onOpenChange}
      >
        {buckets.map((bucket) => (
          <SubMenu key={bucket} title={<a href={`#${bucket}`}>{bucket}</a>}>
            {bucketConfig[bucket].map((property: string) =>
              generateMenu(
                generateRenderableConfig(
                  get(
                    dendronValidator,
                    `definitions.DendronConfig.properties.${property}`
                  ),
                  dendronValidator.definitions,
                  property
                ),
                [property],
                currentValues,
                anyOfValues
              )
            )}
          </SubMenu>
        ))}
      </Menu>
    </Sider>
  );
};

export default SideMenu;
