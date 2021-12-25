/**
 * Namespace for all global configurations.
 */
export type DendronGlobalConfig = {
  enableFMTitle: boolean; // TODO: split implementation to respect non-global config
  enableNoteTitleForLink: boolean; // TODO: split
  enableMermaid: boolean; // TODO: split
  enablePrettyRefs: boolean; // TODO: split
  enableKatex: boolean; // TODO: split
  showChildLinks: boolean;
};

/**
 * Generates default for {@link DendronGlobalConfig}
 * @returns DendronGlobalConfig
 */
export function genDefaultGlobalConfig(): DendronGlobalConfig {
  return {
    enableFMTitle: true, // TODO: split implementation to respect non-global config
    enableNoteTitleForLink: true, // TODO: split
    enableMermaid: true,
    enableKatex: true,
    enablePrettyRefs: true,
    showChildLinks: true,
  };
}
