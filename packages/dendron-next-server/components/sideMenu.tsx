import React from "react";
import { Layout, Menu } from "antd";
import { Config, ObjectConfig } from "../types/formTypes";
import get from "lodash/get";
import isEmpty from "lodash/isEmpty";

import { shouldDisplay } from "../utils/shouldDisplay";

const { Sider } = Layout;
const { SubMenu } = Menu;

type DefaultProptypes = {
  openKeys: string[];
  setOpenKeys: (openKeys: string[]) => void;
  selectedKeys: string[];
  setSelectedKeys: (selectedKeys: string[]) => void;
  currentValues: any;
  dendronFormConfig: Config;
};

const generateMenu = (
  dataDefinition: Config,
  prefix: string[] = [],
  currentValues: any
): JSX.Element => {
  if (!dataDefinition) return <></>;
  const name = prefix.join(".");
  const lastName = (prefix.length && prefix[prefix.length - 1]) || "";
  if (!shouldDisplay(lastName)) return <></>;

  if (
    dataDefinition.type === "string" ||
    dataDefinition.type === "number" ||
    dataDefinition.type === "boolean" ||
    dataDefinition.type === "enum" ||
    dataDefinition.type === "anyOf"
  ) {
    return (
      <Menu.Item
        key={name}
        style={{
          lineHeight: "1.5rem",
          height: "1.5rem",
        }}
      >
        <a href={`#${name}`}>
          {isEmpty(dataDefinition.label)
            ? prefix[prefix.length - 1]
            : dataDefinition.label}
        </a>
      </Menu.Item>
    );
  }

  if (dataDefinition.type === "array") {
    const values = get(currentValues, name) ?? [];
    return (
      <SubMenu key={name} title={dataDefinition.label}>
        {values.map((value: any, index: number) =>
          generateMenu(
            dataDefinition.data,
            [...prefix, index.toString()],
            currentValues
          )
        )}
      </SubMenu>
    );
  }

  if (dataDefinition.type === "record") {
    const values = get(currentValues, name) ?? {};
    return (
      <SubMenu key={name} title={dataDefinition.label}>
        {Object.keys(values).map((value: any) =>
          generateMenu(dataDefinition.data, [...prefix, value], currentValues)
        )}
      </SubMenu>
    );
  }

  // the rest is logic for handling object type

  if (name.length > 0) {
    return (
      <SubMenu
        key={name}
        title={
          isEmpty(dataDefinition.label)
            ? prefix[prefix.length - 1]
            : dataDefinition.label
        }
      >
        {Object.keys((dataDefinition as ObjectConfig).data).map((key) =>
          generateMenu(
            (dataDefinition as ObjectConfig).data[key],
            [...prefix, key],
            currentValues
          )
        )}
      </SubMenu>
    );
  }

  return (
    <>
      {Object.keys((dataDefinition as ObjectConfig).data).map((key) =>
        generateMenu(
          (dataDefinition as ObjectConfig).data[key],
          [...prefix, key],
          currentValues
        )
      )}
    </>
  );
};

const SideMenu: React.FC<DefaultProptypes> = ({
  openKeys,
  setOpenKeys,
  selectedKeys,
  setSelectedKeys,
  currentValues,
  dendronFormConfig: dendronFormConfig,
}) => {
  const onSelectedChange = ({
    item,
    key,
    keyPath,
    selectedKeys,
    domEvent,
  }: any) => {
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
        }}
        inlineIndent={10}
        mode="inline"
        selectedKeys={selectedKeys}
        onSelect={onSelectedChange}
        openKeys={openKeys}
        onOpenChange={onOpenChange}
      >
        {generateMenu(dendronFormConfig, [], currentValues)}
      </Menu>
    </Sider>
  );
};

export default SideMenu;
