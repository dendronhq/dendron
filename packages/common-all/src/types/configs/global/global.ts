import { DendronConfigEntry } from "../base";
import { TopLevelDendronConfig } from "../dendronConfig";

/**
 * Namespace for all global configurations.
 */
export type DendronGlobalConfig = {
  useFMTitle: boolean; // TODO: split implementation to respect non-global config
  hierarchyDisplay: boolean; // TODO: split
  hierarchyDisplayTitle: string; // TODO: split
  useNoteTitleForLink: boolean; // TODO: split
};

/**
 * Given a namespace, return a function that takes a boolean value
 * and returns the respective {@link DendronConfigEntry}
 * for the config useFMTitle
 *
 * @param namespace {@link TopLevelDendronConfig}
 * @returns function that takes a boolean value and outputs a {@link DendronConfigEntry}
 */
export const USE_FM_TITLE = (namespace: TopLevelDendronConfig) => {
  return (value: boolean): DendronConfigEntry<boolean> => {
    return {
      label: `${value ? "Enable" : "Disable"} frontmatter title (${namespace})`,
      desc: value
        ? `Insert frontmatter title of note to the body (${namespace})`
        : `Don't insert frontmatter title of note to the body (${namespace})`,
    };
  };
};

/**
 * Given a namespace, return a function that takes a boolean value
 * and returns the respective {@link DendronConfigEntry}
 * for the config hierarchyDisplay.
 *
 * @param namespace {@link TopLevelDendronConfig}
 * @returns function that takes a boolean value and outputs a {@link DendronConfigEntry}
 */
export const HIERARCHY_DISPLAY = (namespace: TopLevelDendronConfig) => {
  return (value: boolean): DendronConfigEntry<boolean> => {
    return {
      label: `${value ? "Enable" : "Disable"} hierarchy display (${namespace})`,
      desc: value
        ? `Render children link block at the end of the note. (${namespace})`
        : `Don't render children link block. (${namespace})`,
    };
  };
};

/**
 * Given a namespace, return a {@link DendronConfigEntry} for hierarchyDisplayTitle
 * for the respective namespace
 * @param namespace {@link TopLevelDendronConfig}
 * @returns {@link DendronConfigEntry}
 */
export const HIERARCHY_DISPLAY_TITLE = (
  namespace: TopLevelDendronConfig
): DendronConfigEntry<string> => {
  return {
    label: `hierarhcy display title ${namespace}`,
    desc: `Title to display for the children links block. ${namespace}`,
  };
};

/**
 * Given a namespace, return a function that takes a boolean value
 * and returns the respective {@link DendronConfigEntry}
 * for the config useNoteTitleForLink.
 *
 * @param namespace {@link TopLevelDendronConfig}
 * @returns function that takes a boolean value and outputs a {@link DendronConfigEntry}
 */
export const USE_NOTE_TITLE_FOR_LINK = (namespace: TopLevelDendronConfig) => {
  return (value: boolean): DendronConfigEntry<boolean> => {
    return {
      label: `${
        value ? "Enable" : "Disable"
      } note title for links (${namespace})`,
      desc: value
        ? `Render naked links as the title of the note. (${namespace})`
        : `Render links as alias or filename. (${namespace})`,
    };
  };
};

/**
 * Constants holding all global config related {@link DendronConfigEntry}
 */
export const GLOBAL = {
  USE_FM_TITLE: USE_FM_TITLE("global"), // TODO: split implementation to respect non-global config
  HIERARCHY_DISPLAY: HIERARCHY_DISPLAY("global"), // TODO: split
  HIERARCHY_DISPLAY_TITLE: HIERARCHY_DISPLAY_TITLE("global"), //TODO: split
  USE_NOTE_TITLE_FOR_LINK: USE_NOTE_TITLE_FOR_LINK("global"), // TODO: split
};

export function genDefaultGlobalConfig(): DendronGlobalConfig {
  return {
    useFMTitle: true, // TODO: split implementation to respect non-global config
    hierarchyDisplay: true, // TODO: split
    hierarchyDisplayTitle: "children", // TODO: split
    useNoteTitleForLink: true, // TODO: split
  };
}
