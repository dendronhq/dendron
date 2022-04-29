import { genDefaultTreeViewConfig, TreeViewConfig } from "./treeView";

export type DendronViewsConfig = {
  treeView: TreeViewConfig;
};

export function genDefaultDendronViewsConfig(): DendronViewsConfig {
  return {
    treeView: genDefaultTreeViewConfig(),
  };
}
