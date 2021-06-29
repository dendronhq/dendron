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
type ModifyPickerValueFunc = (value: string) => string;

export type DendronQuickPickItemV2 = QuickPick<DNodePropsQuickInputV2>;
export type DendronQuickPickerV2 = DendronQuickPickItemV2 & {
  // --- Private State
  _justActivated?: boolean;

  // --- Public Props
  /**
   * Quickpick will hide results that aren't matched by VSCode internal filter.
   * Setting this true will always show ALL results that lookup returns
   */
  alwaysShowAll?: boolean;
  /**
   * Buttons control modifiers for lookup
   */
  buttons: DendronBtn[];
  nonInteractive?: boolean;
  prev?: { activeItems: any; items: any };
  prevValue?: string;

  /**
   * Value before being modified
   */
  rawValue: string;
  onCreate?: (note: DNodeProps) => Promise<DNodeProps | undefined>;
  /**
   @deprecated, replace with filterResults
   */
  showDirectChildrenOnly?: boolean;
  // pagiation
  offset?: number;
  moreResults?: boolean;
  allResults?: DNodeProps[];
  /**
   * Should VSCode managing sorting of results?
   * Supported in VSCode but not added to the type definition files, see https://github.com/microsoft/vscode/issues/73904#issuecomment-680298036
   */
  sortByLabel?: boolean;
  /**
   * Vault for newly created note. If not specified in picker,
   * will be prmpted
   */
  vault?: DVault;
  // --- Methods
  /**
   * Filter results through filter middleware
   */
  filterMiddleware?: FilterQuickPickFunction;
  /**
   * Modify picker value
   */
  modifyPickerValueFunc?: ModifyPickerValueFunc;
  /**
   * Should show a subsequent picker?
   */
  nextPicker?: () => any;
  /**
   * TODO: should be required
   */
  showNote?: (uri: Uri) => Promise<TextEditor>;
};
