export enum LookupSelectionTypeEnum {
  "selection2link" = "selection2link",
  "selectionExtract" = "selectionExtract",
  "selection2Items" = "selection2Items",
  "none" = "none",
}

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
