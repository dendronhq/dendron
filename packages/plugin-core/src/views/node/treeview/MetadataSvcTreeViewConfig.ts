import { TreeViewItemLabelTypeEnum } from "@dendronhq/common-all";
import { MetadataService } from "@dendronhq/engine-server";
import { ITreeViewConfig } from "../../common/treeview/ITreeViewConfig";

/**
 * Config for Tree View when extension is run locally- this version pull values from
 * MetadataService
 */
export class MetadataSvcTreeViewConfig implements ITreeViewConfig {
  private _labelType = MetadataService.instance().getTreeViewItemLabelType();

  get LabelTypeSetting(): TreeViewItemLabelTypeEnum {
    return this._labelType;
  }

  set LabelTypeSetting(labelType: TreeViewItemLabelTypeEnum) {
    this._labelType = labelType;
    MetadataService.instance().setTreeViewItemLabelType(labelType);
  }
}
