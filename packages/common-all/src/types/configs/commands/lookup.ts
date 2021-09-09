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
  confirmVaultOnCreate?: boolean;
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
    label: "selection to link",
    desc: "Use selection of active editor for the basename of the lookup value.",
  },
  none: {
    value: NoteLookupSelectionBehaviorEnum.none,
    label: "none",
    desc: "Do not set selection behavior",
  },
};

const CONFIRM_VAULT_ON_CREATE = (
  value: boolean
): DendronConfigEntry<boolean> => {
  return {
    value,
    label: `${value ? "enable" : "disable"} confirm vault on create.`,
    desc: `${value ? "" : "Do not "}pick valut when creating new note.`,
  };
};

/**
 * Constants / functions that produce
 * constants for possible lookup configurations
 */
export const LOOKUP = {
  NOTE: {
    SELECTION: SELECTION_BEHAVIORS,
    CONFIRM_VAULT_ON_CREATE,
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
      confirmVaultOnCreate: false,
    },
  };
}
