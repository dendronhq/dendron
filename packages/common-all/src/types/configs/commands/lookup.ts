import { DendronConfigEntry } from "../base";

export enum NoteLookupSelectionBehaviorEnum {
  extract = "extract",
  link = "link",
  none = "none",
}

export type NoteLookupSelectionBehavior =
  keyof typeof NoteLookupSelectionBehaviorEnum;

type NoteLookupConfig = {
  selection: NoteLookupSelectionBehavior;
};

export type LookupConfig = {
  note: NoteLookupConfig;
};

export const NOTE_LOOKUP_SELECTION_BEHAVIORS: {
  [key: string]: DendronConfigEntry<string>;
} = {
  EXTRACT: {
    value: NoteLookupSelectionBehaviorEnum.extract,
    label: "extract selection",
    desc: "Extract selection of active editor and use it as body of new note.",
  },
  LINK: {
    value: NoteLookupSelectionBehaviorEnum.link,
    label: "selection 2 link",
    desc: "Use selection of active editor for the basename of the lookup value.",
  },
  NONE: {
    value: NoteLookupSelectionBehaviorEnum.none,
    label: "none",
    desc: "Do not set selection behavior",
  },
};

export function genDefaultLookupConfig(): LookupConfig {
  return {
    note: {
      selection: NoteLookupSelectionBehaviorEnum.extract,
    },
  };
}
