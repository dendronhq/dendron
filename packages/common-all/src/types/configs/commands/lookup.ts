/**
 * Enum definition of possible lookup selection behavior values
 */
export enum LookupSelectionModeEnum {
  extract = "extract",
  link = "link",
  none = "none",
}

/**
 * String literal type generated from {@link NoteLookupSelectionBehaviorEnum}
 */
export type LookupSelectionMode = keyof typeof LookupSelectionModeEnum;

/**
 * Namespace for configuring lookup commands
 */
export type LookupConfig = {
  note: NoteLookupConfig;
};

/**
 * Namespace for configuring {@link NoteLookupCommand}
 */
export type NoteLookupConfig = {
  selectionMode: LookupSelectionMode;
  confirmVaultOnCreate: boolean;
  leaveTrace: boolean;
  bubbleUpCreateNew: boolean;
  fuzzThreshold?: number;
};

/**
 * Generates default {@link LookupConfig}
 * @returns LookupConfig
 */
export function genDefaultLookupConfig(): LookupConfig {
  return {
    note: {
      selectionMode: LookupSelectionModeEnum.extract,
      confirmVaultOnCreate: false,
      leaveTrace: false,
      bubbleUpCreateNew: true,
    },
  };
}
