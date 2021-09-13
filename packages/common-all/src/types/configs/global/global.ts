/**
 * Namespace for all global configurations.
 */
export type DendronGlobalConfig = {
  enableFMTitle: boolean; // TODO: split implementation to respect non-global config
  enableHierarchyDisplay: boolean; // TODO: split
  hierarchyDisplayTitle: string; // TODO: split
  enableNoteTitleForLink: boolean; // TODO: split
  enableMermaid: boolean; // TODO: split
  enableNunjucks: boolean; // TODO: split
  enablePrettyRefs: boolean; // TODO: split
  enableKatex: boolean; // TODO: split
  enableLegacyNoteRef: boolean; // TODO: split
};

/**
 * Generates default for {@link DendronGlobalConfig}
 * @returns DendronGlobalConfig
 */
export function genDefaultGlobalConfig(): DendronGlobalConfig {
  return {
    enableFMTitle: true, // TODO: split implementation to respect non-global config
    enableHierarchyDisplay: true, // TODO: split
    hierarchyDisplayTitle: "children", // TODO: split
    enableNoteTitleForLink: true, // TODO: split
    enableMermaid: true,
    enableKatex: true,
    enableNunjucks: false,
    enablePrettyRefs: true,
    enableLegacyNoteRef: false,
  };
}
