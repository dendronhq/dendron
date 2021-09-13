/**
 * Enum definitions of possible alias mode values
 */
export enum InsertNoteLinkAliasModeEnum {
  snippet = "snippet",
  selection = "selection",
  title = "title",
  prompt = "prompt",
  none = "none",
}

/**
 * String literal types generated from {@link InsertNoteLinkAliasModeEnum}
 */
export type InsertNoteLinkAliasMode = keyof typeof InsertNoteLinkAliasModeEnum;

/**
 * Namespace for configuring {@link InsertNoteLinkCommand}
 */
export type InsertNoteLinkConfig = {
  aliasMode: InsertNoteLinkAliasModeEnum;
  useMultiSelect: boolean;
};

/**
 * Generates default {@link InsertNoteLinkConfig}
 * @returns InsertNoteLinkConfig
 */
export function genDefaultInsertNoteLinkConfig(): InsertNoteLinkConfig {
  return {
    aliasMode: InsertNoteLinkAliasModeEnum.none,
    useMultiSelect: false,
  };
}
