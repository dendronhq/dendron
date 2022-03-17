import { TwoWayBinding } from "../../types/TwoWayBinding";
import { VaultSelectionMode } from "./types";

export enum NameModifierMode {
  None,
  Journal,
  Scratch,
  Task,
}

export enum SelectionMode {
  selectionExtract,
  selection2Link,
  selection2Items,
  None,
}

/**
 * A view model for the lookup control. Contains options for both the quick pick
 * and lookup panel view
 */
export interface ILookupViewModel {
  selectionState: TwoWayBinding<SelectionMode>;
  vaultSelectionMode: TwoWayBinding<VaultSelectionMode>;
  isMultiSelectEnabled: TwoWayBinding<boolean>;
  isCopyNoteLinkEnabled: TwoWayBinding<boolean>;
  isApplyDirectChildFilter: TwoWayBinding<boolean>;
  nameModifierMode: TwoWayBinding<NameModifierMode>; // Journal / Scratch / Task
  isSplitHorizontally: TwoWayBinding<boolean>;
}
