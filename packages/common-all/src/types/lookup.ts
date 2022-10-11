/**
 * @deprecated
 *
 * This should not be used in configs that are public-facing.
 * There are a few references to this remaining, but they are all internal-only and will be cleaned up.
 * Use {@link LookupSelectionModeEnum} instead
 */
export enum LookupSelectionTypeEnum {
  "selection2link" = "selection2link",
  "selectionExtract" = "selectionExtract",
  "selection2Items" = "selection2Items",
  "none" = "none",
}

/**
 * @deprecated
 *
 * This should not be used in configs that are public-facing.
 * There are a few references to this remaining, but they are all internal-only and will be cleaned up.
 * Use {@link LookupSelectionMode} instead
 */
export type LookupSelectionType = keyof typeof LookupSelectionTypeEnum;

export enum LookupNoteTypeEnum {
  "journal" = "journal",
  "scratch" = "scratch",
  "task" = "task",
  "none" = "none",
}

export type LookupNoteType = keyof typeof LookupNoteTypeEnum;

export enum LookupEffectTypeEnum {
  "copyNoteLink" = "copyNoteLink",
  "multiSelect" = "multiSelect",
}

export type LookupEffectType = keyof typeof LookupEffectTypeEnum;

export type LookupModifierStatePayload = {
  type: string;
  pressed: boolean;
}[];

export enum LookupSplitTypeEnum {
  "horizontal" = "horizontal",
}

export type LookupSplitType = keyof typeof LookupSplitTypeEnum;

export enum LookupFilterTypeEnum {
  "directChildOnly" = "directChildOnly",
}

export type LookupFilterType = keyof typeof LookupFilterTypeEnum;

export type AllModifierType =
  | LookupSelectionType
  | LookupNoteType
  | LookupEffectType
  | LookupSplitType
  | LookupFilterType;
