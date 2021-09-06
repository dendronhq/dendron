import { DendronConfigEntry } from "../base";

/**
 * Enum definition of possible lookup selection behavior values
 */
export enum NoteLookupSelectionBehaviorEnum {
  extract = "extract",
  link = "link",
  none = "none",
}

/**
 * String literal type generated from {@link NoteLookupSelectionBehaviorEnum}
 */
export type NoteLookupSelectionBehavior =
  keyof typeof NoteLookupSelectionBehaviorEnum;

/**
 * Namespace for configuring lookup commands
 */
export type LookupConfig = {
  note: NoteLookupConfig;
};

/**
 * Namespace for configuring {@link NoteLookupCommand}
 */
type NoteLookupConfig = {
  selectionBehavior: NoteLookupSelectionBehavior;
};

/**
 * Constants for possible note lookup selection behaviors.
 * Each key holds a {@link DendronConfigEntry}
 * which specifies the value, label, description of possible selection behaviors.
 *
 * These are used to generate user friendly descriptions in the configuration UI.
 */
const SELECTION_BEHAVIORS: {
  [key in NoteLookupSelectionBehavior]: DendronConfigEntry<string>;
} = {
  extract: {
    value: NoteLookupSelectionBehaviorEnum.extract,
    label: "extract selection",
    desc: "Extract selection of active editor and use it as body of new note.",
  },
  link: {
    value: NoteLookupSelectionBehaviorEnum.link,
    label: "selection 2 link",
    desc: "Use selection of active editor for the basename of the lookup value.",
  },
  none: {
    value: NoteLookupSelectionBehaviorEnum.none,
    label: "none",
    desc: "Do not set selection behavior",
  },
};

/**
 * Constants / functions that produce
 * constants for possible lookup configurations
 */
export const LOOKUP = {
  NOTE: {
    SELECTION: SELECTION_BEHAVIORS,
  },
};

/**
 * Generates default {@link LookupConfig}
 * @returns LookupConfig
 */
export function genDefaultLookupConfig(): LookupConfig {
  return {
    note: {
      selectionBehavior: NoteLookupSelectionBehaviorEnum.extract,
    },
  };
}
