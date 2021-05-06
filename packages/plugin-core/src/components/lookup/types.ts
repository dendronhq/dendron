import {
  DNodePropsQuickInputV2,
  DNodeProps,
  DVault,
} from "@dendronhq/common-all";
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
  nonInteractive?: boolean;
  prev?: { activeItems: any; items: any };
  onCreate?: (note: DNodeProps) => Promise<DNodeProps | undefined>;
  showDirectChildrenOnly?: boolean;
  // pagiation
  offset?: number;
  moreResults?: boolean;
  allResults?: DNodeProps[];
  vault?: DVault;
  nextPicker?: () => any;
};
