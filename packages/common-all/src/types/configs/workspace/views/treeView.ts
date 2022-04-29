export type TreeViewConfig = {
  treeItemLabelType: TreeItemLabelTypeEnum;
};

export enum TreeItemLabelTypeEnum {
  title = "title",
  filename = "filename",
}

export function genDefaultTreeViewConfig(): TreeViewConfig {
  return {
    treeItemLabelType: TreeItemLabelTypeEnum.title,
  };
}
