import {
  DNodePropsQuickInputV2,
  DNodeProps,
  NoteProps,
  DVault,
  NoteQuickInputV2,
} from "@dendronhq/common-all";
import { QuickPick, QuickPickItem, TextEditor, Uri } from "vscode";
import { DendronBtn } from "./ButtonTypes";

export type FilterQuickPickFunction = (
  items: NoteQuickInputV2[]
) => NoteQuickInputV2[];
type ModifyPickerValueFunc = (value?: string) => {
  noteName: string;
  prefix: string;
};
type SelectionProcessFunc = (note: NoteProps) => Promise<NoteProps | undefined>;
type CopyNoteLinkFunc = (items: NoteProps[]) => Promise<void> | undefined;
export enum DendronQuickPickState {
  /**
   * Default state
   */
  IDLE = "IDLE",
  /**
   * Finished taking request
   */
  FULFILLED = "FULFILLED",
  /**
   * About to show a new picker. Old picker will be hidden but we are still gathering further input
   */
  PENDING_NEXT_PICK = "PENDING_NEXT_PICK",
}

export type DendronQuickPickItemV2 = QuickPick<NoteQuickInputV2>;
export type DendronQuickPickerV2 = DendronQuickPickItemV2 & {
  // --- Private State
  _justActivated?: boolean;

  // --- Public Props
  /**
   * Quickpick will hide results that aren't matched by VSCode internal filter.
   * Setting this true will always show ALL results that lookup returns
   */
  alwaysShowAll?: boolean;
  state: DendronQuickPickState;
  /**
   * Buttons control modifiers for lookup
   */
  buttons: DendronBtn[];
  nonInteractive?: boolean;
  prev?: { activeItems: any; items: any };
  /**
   * Used by {@link DendronBtn} to store tmp state
   */
  prevValue?: string;
  /**
   * Previous value in quickpick
   */
  prevQuickpickValue?: string;

  /**
   * Value before being modified
   */
  rawValue: string;
  prefix: string;
  noteModifierValue?: string;
  selectionModifierValue?: string;
  onCreate?: (note: DNodeProps) => Promise<DNodeProps | undefined>;

  showDirectChildrenOnly?: boolean;
  // pagiation
  offset?: number;
  moreResults?: boolean;
  allResults?: Omit<DNodeProps, "body">[];
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
   * Method to process selected text in active note.
   */
  selectionProcessFunc?: SelectionProcessFunc;
  /**
   *
   */
  itemsFromSelection?: DNodePropsQuickInputV2[];
  /**
   * select all when quickpick is created and canSelectMany
   * NOTE: this is only used with multiSelect + selection2Items
   */
  selectAll?: boolean;
  /**
   * Method to copy note link
   */
  copyNoteLinkFunc?: CopyNoteLinkFunc;
  /**
   * Should show a subsequent picker?
   */
  nextPicker?: (opts: any) => any;
  /**
   * TODO: should be required
   */
  showNote?: (uri: Uri) => Promise<TextEditor>;
};

export type DendronWebQuickPick<T extends QuickPickItem> = QuickPick<T> & {
  buttons: DendronBtn[];
};

export enum VaultSelectionMode {
  /**
   * Never prompt the user. Useful for testing
   */
  auto,

  /**
   * Tries to determine the vault automatically, but will prompt the user if
   * there is ambiguity
   */
  smart,

  /**
   * Always prompt the user if there is more than one vault
   */
  alwaysPrompt,
}
