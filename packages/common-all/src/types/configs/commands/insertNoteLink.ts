import { DendronConfigEntry } from "../base";

export enum InsertNoteLinkAliasModeEnum {
  snippet = "snippet",
  selection = "selection",
  title = "title",
  prompt = "prompt",
  none = "none",
}

export type InsertNoteLinkAliasMode = keyof typeof InsertNoteLinkAliasModeEnum;

export type InsertNoteLinkConfig = {
  aliasMode: InsertNoteLinkAliasModeEnum;
  multiSelect: boolean;
};

export const INSERT_NOTE_LINK_ALIAS_MODES: {
  [key: string]: DendronConfigEntry<string>;
} = {
  SNIPPET: {
    value: InsertNoteLinkAliasModeEnum.snippet,
    label: "snippet mode",
    desc: "Insert note link as snippet string",
  },
  SELECTION: {
    value: InsertNoteLinkAliasModeEnum.selection,
    label: "selection mode",
    desc: "Extract selection and use as link alias",
  },
  TITLE: {
    value: InsertNoteLinkAliasModeEnum.title,
    label: "title mode",
    desc: "Use linked note's title as link alias",
  },
  PROMPT: {
    value: InsertNoteLinkAliasModeEnum.prompt,
    label: "prompt mode",
    desc: "Prompt for input to be used as link alias",
  },
  NONE: {
    value: InsertNoteLinkAliasModeEnum.none,
    label: "no alias mode",
    desc: "Do not add link alias",
  },
};

export const INSERT_NOTE_LINK_MULTISELECT = (
  value: boolean
): DendronConfigEntry<boolean> => {
  const valueToString = value ? "Enable" : "Disable";
  return {
    value,
    label: `${valueToString} multi-select`,
    desc: `${valueToString} multi-select when inserting note link(s)`,
  };
};

export function genDefaultInsertNoteLinkConfig(): InsertNoteLinkConfig {
  return {
    aliasMode: InsertNoteLinkAliasModeEnum.none,
    multiSelect: false,
  };
}
