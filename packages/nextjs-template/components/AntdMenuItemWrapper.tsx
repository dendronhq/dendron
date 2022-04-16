import { Menu, MenuItemProps } from "antd";

function AntdMenuItemWrapper(props: MenuItemProps) {
  return <Menu.Item {...props} />;
}

export default AntdMenuItemWrapper;
