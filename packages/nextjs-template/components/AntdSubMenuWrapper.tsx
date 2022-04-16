import { Menu, SubMenuProps } from "antd";

const { SubMenu } = Menu;

function AntdSubmenuWrapper(props: SubMenuProps) {
  return <SubMenu {...props} />;
}

export default AntdSubmenuWrapper;
