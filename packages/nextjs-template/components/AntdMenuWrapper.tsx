import { Menu } from "antd";
import { MenuProps } from "rc-menu";

function AntdMenuWrapper(props: MenuProps) {
  // @ts-ignore
  return <Menu {...props} />;
}

export default AntdMenuWrapper;
