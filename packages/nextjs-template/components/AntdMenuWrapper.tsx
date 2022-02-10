import { Menu } from "antd";
import { MenuProps } from "rc-menu";

function AntdMenuWrapper(props: MenuProps) {
  return <Menu {...props} />;
}

export default AntdMenuWrapper;
