import { TreeViewItemLabelTypeEnum } from "@dendronhq/common-all";
import { ITreeViewConfig } from "./ITreeViewConfig";

/**
 * Dummy Config for Tree View - this version doesn't pull values from
 * MetadataService or any other persisted storage, nor does it save any settings
 * that a user specified beyond their current session. This is meant to be used
 * in Dendron Web Extension until persistent settings can be implemented in the
 * Web Extension.
 */
export class TreeViewDummyConfig implements ITreeViewConfig {
  private _labelType = TreeViewItemLabelTypeEnum.filename;

  /**
   * This just defaults to sorting by file name initially
   */
  get LabelTypeSetting(): TreeViewItemLabelTypeEnum {
    return this._labelType;
  }

  /**
   * This doesn't touch any persistent settings
   */
  set LabelTypeSetting(_value: TreeViewItemLabelTypeEnum) {
    this._labelType = _value;
  }
}
