import { DendronConfigEntry } from "../base";

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
  multiSelect: boolean;
};

/**
 * Constants for possible alias mode choices.
 * Each key of {@link InsertNoteLinkAliasMode} is mapped to a {@link DendronConfigEntry}
 * which specifies the value, label, description of possible alias modes.
 *
 * These are used to generate user friendly descriptions in the configuration UI.
 */
const ALIAS_MODES: {
  [key in InsertNoteLinkAliasMode]: DendronConfigEntry<string>;
} = {
  snippet: {
    value: InsertNoteLinkAliasModeEnum.snippet,
    label: "snippet mode",
    desc: "Insert note link as snippet string",
  },
  selection: {
    value: InsertNoteLinkAliasModeEnum.selection,
    label: "selection mode",
    desc: "Extract selection and use as link alias",
  },
  title: {
    value: InsertNoteLinkAliasModeEnum.title,
    label: "title mode",
    desc: "Use linked note's title as link alias",
  },
  prompt: {
    value: InsertNoteLinkAliasModeEnum.prompt,
    label: "prompt mode",
    desc: "Prompt for input to be used as link alias",
  },
  none: {
    value: InsertNoteLinkAliasModeEnum.none,
    label: "no alias mode",
    desc: "Do not add link alias",
  },
};

/**
 * Given a boolean value, returns a {@link DendronConfigEntry} that holds
 * user friendly description of the multi-select behavior.
 *
 * This is a function instead of an object because object keys cannot be booleans.
 *
 * @param value boolean
 * @returns DendronConfigEntry<boolean>
 */
const MULTI_SELECT = (value: boolean): DendronConfigEntry<boolean> => {
  const valueToString = value ? "Enable" : "Disable";
  return {
    value,
    label: `${valueToString} multi-select`,
    desc: `${valueToString} multi-select when inserting note link(s)`,
  };
};

/**
 * Constants / functions that produce constants for
 * possible insert note link configurations.
 */
export const INSERT_NOTE_LINK = {
  ALIAS_MODES,
  MULTI_SELECT,
};

/**
 * Generates default {@link InsertNoteLinkConfig}
 * @returns InsertNoteLinkConfig or undefined
 */
export function genDefaultInsertNoteLinkConfig():
  | InsertNoteLinkConfig
  | undefined {
  return;
}
