import React from "react";
import { Layout, Menu } from "antd";
import { Config, ObjectConfig } from "../types/formTypes";
import dendronFormConfig from "../data/dendronFormConfig";

const { Sider } = Layout;
const { SubMenu } = Menu;

type DefaultProptypes = {
  openKeys: string[];
  setOpenKeys: (openKeys: string[]) => void;
  selectedKeys: string[];
  setSelectedKeys: (selectedKeys: string[]) => void;
};

const generateMenu = (
  dataDefinition: Config,
  prefix: string[] = []
): JSX.Element => {
  if (
    dataDefinition.type === "string" ||
    dataDefinition.type === "number" ||
    dataDefinition.type === "boolean" ||
    dataDefinition.type === "enum" ||
    dataDefinition.type === "array" ||
    dataDefinition.type === "record"
  ) {
    return (
      <Menu.Item key={`${prefix.join(".")}`}>
        <a href={`#${prefix.join(".")}`}>{dataDefinition.label}</a>
      </Menu.Item>
    );
  }

  return prefix.length > 0 ? (
    <SubMenu key={`${prefix.join(".")}`} title={dataDefinition.label}>
      {Object.keys((dataDefinition as ObjectConfig).data).map((key) => {
        return generateMenu((dataDefinition as ObjectConfig).data[key], [
          ...prefix,
          key,
        ]);
      })}
    </SubMenu>
  ) : (
    <>
      {Object.keys((dataDefinition as ObjectConfig).data).map((key) => {
        return generateMenu((dataDefinition as ObjectConfig).data[key], [
          ...prefix,
          key,
        ]);
      })}
    </>
  );
};

const SideMenu: React.FC<DefaultProptypes> = ({
  openKeys,
  setOpenKeys,
  selectedKeys,
  setSelectedKeys,
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
        }}
        mode="inline"
        selectedKeys={selectedKeys}
        onSelect={onSelectedChange}
      >
        {generateMenu(dendronFormConfig, [])}
      </Menu>
    </Sider>
  );
};

export default SideMenu;
