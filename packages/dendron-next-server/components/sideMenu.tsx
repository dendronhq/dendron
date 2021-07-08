import React from "react";
import { Layout, Menu } from "antd";
import { Config, ObjectConfig } from "../types/formTypes";
import dendronFormConfig from "../data/dendronFormConfig";
import get from "lodash/get";

const { Sider } = Layout;
const { SubMenu } = Menu;

type DefaultProptypes = {
  openKeys: string[];
  setOpenKeys: (openKeys: string[]) => void;
  selectedKeys: string[];
  setSelectedKeys: (selectedKeys: string[]) => void;
  currentValues: any;
};

const generateMenu = (
  dataDefinition: Config,
  prefix: string[] = [],
  currentValues: any
): JSX.Element => {
  const name = prefix.join(".");
  console.log("name: ", name);
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
          fontSize: "1rem",
          lineHeight: "1.5rem",
          height: "1.5rem",
        }}
      >
        <a href={`#${name}`}>
          {dataDefinition.label ?? prefix[prefix.length - 1]}
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
        title={dataDefinition.label ?? prefix[prefix.length - 1]}
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
}) => {
  const onSelectedChange = ({
    item,
    key,
    keyPath,
    selectedKeys,
    domEvent,
  }: any) => {
    console.log("select: ", { key, item, keyPath, selectedKeys });
    setSelectedKeys(selectedKeys);
  };

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
        }}
        inlineIndent={10}
        mode="inline"
        selectedKeys={selectedKeys}
        onSelect={onSelectedChange}
      >
        {generateMenu(dendronFormConfig, [], currentValues)}
      </Menu>
    </Sider>
  );
};

export default SideMenu;
