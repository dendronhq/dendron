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
  mermaid: boolean; // TODO: split
  useNunjucks: boolean; // TODO: split
  usePrettyRefs: boolean; // TODO: split
  useKatex: boolean; // TODO: split
  noLegacyNoteRef: boolean; // TODO: split
};

export const MERMAID = (
  namespace: TopLevelDendronConfig
): DendronConfigEntry<boolean> => {
  return {
    label: `use mermaid (${namespace})`,
    desc: `Enable the use of mermaid for rendering diagrams. (${namespace})`,
  };
};

export const USE_NUNJUCKS = (
  namespace: TopLevelDendronConfig
): DendronConfigEntry<boolean> => {
  return {
    label: `use nunjucks (${namespace})`,
    desc: `Enable the use of nunjucks templates in the note body. (${namespace})`,
  };
};

export const USE_PRETTY_REFS = (
  namespace: TopLevelDendronConfig
): DendronConfigEntry<boolean> => {
  return {
    label: `use pretty refs (${namespace})`,
    desc: `Render note references as pretty refs. (${namespace})`,
  };
};

export const USE_KATEX = (
  namespace: TopLevelDendronConfig
): DendronConfigEntry<boolean> => {
  return {
    label: `use katex (${namespace})`,
    desc: `Enable the use of katex for rendering math. (${namespace})`,
  };
};

export const NO_LEGACY_NOTE_REF = (
  namespace: TopLevelDendronConfig
): DendronConfigEntry<boolean> => {
  return {
    label: `no legacy note ref (${namespace})`,
    desc: `Disable legacy note references. (${namespace})`,
  };
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
  MERMAID: MERMAID("global"),
  USE_NUNJUCKS: USE_NUNJUCKS("global"),
  USE_PRETTY_REFS: USE_PRETTY_REFS("global"),
  USE_KATEX: USE_KATEX("global"),
  NO_LEGACY_NOTE_REF: NO_LEGACY_NOTE_REF("global"),
};

export function genDefaultGlobalConfig(): DendronGlobalConfig {
  return {
    useFMTitle: true, // TODO: split implementation to respect non-global config
    hierarchyDisplay: true, // TODO: split
    hierarchyDisplayTitle: "children", // TODO: split
    useNoteTitleForLink: true, // TODO: split
    mermaid: true,
    useKatex: true,
    useNunjucks: false,
    usePrettyRefs: true,
    noLegacyNoteRef: true,
  };
}
