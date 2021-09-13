import { TopLevelDendronConfig } from "../../types/configs/dendronConfig";
import {
  DendronConfigEntry,
  DendronConfigEntryCollection,
} from "../../types/configs/base";
import { DendronGlobalConfig } from "../../types/configs/global/global";

export const ENABLE_MERMAID = (
  namespace: TopLevelDendronConfig
): DendronConfigEntry<boolean> => {
  return {
    label: `Enable Mermaid (${namespace})`,
    desc: `Enable the use of mermaid for rendering diagrams. (${namespace})`,
  };
};

export const ENABLE_NUNJUCKS = (
  namespace: TopLevelDendronConfig
): DendronConfigEntry<boolean> => {
  return {
    label: `Enable Nunjucks (${namespace})`,
    desc: `Enable the use of nunjucks templates in the note body. (${namespace})`,
  };
};

export const ENABLE_PRETTY_REFS = (
  namespace: TopLevelDendronConfig
): DendronConfigEntry<boolean> => {
  return {
    label: `Enable Pretty Refs (${namespace})`,
    desc: `Enable rendering note references as pretty refs. (${namespace})`,
  };
};

export const ENABLE_KATEX = (
  namespace: TopLevelDendronConfig
): DendronConfigEntry<boolean> => {
  return {
    label: `Enable Katex (${namespace})`,
    desc: `Enable the use of katex for rendering math. (${namespace})`,
  };
};

export const ENABLE_LEGACY_NOTE_REF = (
  namespace: TopLevelDendronConfig
): DendronConfigEntry<boolean> => {
  return {
    label: `Enable Legacy Note Ref (${namespace})`,
    desc: `Enable legacy note references. (${namespace})`,
  };
};

export const ENABLE_FM_TITLE = (namespace: TopLevelDendronConfig) => {
  return {
    label: `Enable Frontmatter Title (${namespace})`,
    desc: `Insert frontmatter title of note to the body (${namespace})`,
  };
};

export const ENABLE_HIERARCHY_DISPLAY = (namespace: TopLevelDendronConfig) => {
  return {
    label: `Enable Hierarchy Display (${namespace})`,
    desc: `Enable rendering of children link block at the end of the note. (${namespace})`,
  };
};

export const HIERARCHY_DISPLAY_TITLE = (
  namespace: TopLevelDendronConfig
): DendronConfigEntry<string> => {
  return {
    label: `Hierarhcy Display Title ${namespace}`,
    desc: `Title to display for the children links block. ${namespace}`,
  };
};

export const ENABLE_NOTE_TITLE_FOR_LINK = (
  namespace: TopLevelDendronConfig
) => {
  return {
    label: `Enable Note Title for Links (${namespace})`,
    desc: `Enable rendering of naked links as the title of the note. (${namespace})`,
  };
};

export const GLOBAL: DendronConfigEntryCollection<DendronGlobalConfig> = {
  enableFMTitle: ENABLE_FM_TITLE("global"), // TODO: split implementation to respect non-global config
  enableHierarchyDisplay: ENABLE_HIERARCHY_DISPLAY("global"), // TODO: split
  hierarchyDisplayTitle: HIERARCHY_DISPLAY_TITLE("global"), //TODO: split
  enableNoteTitleForLink: ENABLE_NOTE_TITLE_FOR_LINK("global"), // TODO: split
  enableMermaid: ENABLE_MERMAID("global"),
  enableNunjucks: ENABLE_NUNJUCKS("global"),
  enablePrettyRefs: ENABLE_PRETTY_REFS("global"),
  enableKatex: ENABLE_KATEX("global"),
  enableLegacyNoteRef: ENABLE_LEGACY_NOTE_REF("global"),
};
