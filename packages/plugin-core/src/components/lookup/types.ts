import {
  DNodePropsQuickInputV2,
  DNodeProps,
  DVault,
  NoteQuickInput,
} from "@dendronhq/common-all";
import { QuickPick, TextEditor, Uri } from "vscode";
import { DendronBtn } from "./buttons";

export type LookupControllerState = {
  buttons: DendronBtn[];
  buttonsPrev: DendronBtn[];
};

type FilterQuickPickFunction = (items: NoteQuickInput[]) => NoteQuickInput[];
export type DendronQuickPickItemV2 = QuickPick<DNodePropsQuickInputV2>;
export type DendronQuickPickerV2 = DendronQuickPickItemV2 & {
  buttons: DendronBtn[];
  justActivated?: boolean;
  nonInteractive?: boolean;
  prev?: { activeItems: any; items: any };
  onCreate?: (note: DNodeProps) => Promise<DNodeProps | undefined>;
  /**
   @deprecated, replace with filterResults
   */
  showDirectChildrenOnly?: boolean;
  // pagiation
  offset?: number;
  moreResults?: boolean;
  allResults?: DNodeProps[];
  vault?: DVault;
  filterMiddleware?: FilterQuickPickFunction;
  nextPicker?: () => any;
  /**
   * TODO: should be required
   */
  showNote?: (uri: Uri) => Promise<TextEditor>;
};
