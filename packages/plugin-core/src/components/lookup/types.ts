import { DNodePropsQuickInputV2, DNodePropsV2 } from "@dendronhq/common-all";
import { QuickPick } from "vscode";
import { DendronBtn } from "./buttons";

export type LookupControllerState = {
  buttons: DendronBtn[];
  buttonsPrev: DendronBtn[];
};

export type DendronQuickPickItemV2 = QuickPick<DNodePropsQuickInputV2>;
export type DendronQuickPickerV2 = DendronQuickPickItemV2 & {
  buttons: DendronBtn[];
  justActivated?: boolean;
  prev?: { activeItems: any; items: any };
  onCreate?: (note: DNodePropsV2) => Promise<void>;
  showDirectChildrenOnly?: boolean;
};
